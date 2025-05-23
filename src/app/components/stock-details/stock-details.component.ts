// Update class to include necessary fields for API interaction
import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { StockDto } from '../../types/StockDto';
import { ControlStockDetailsService } from '../../services/stock-details.service';
import { ActivatedRoute } from '@angular/router';
import { StockService } from '../../services/stock.service';
import { switchMap } from 'rxjs/operators';
import { PutIdPartidaDto } from '../../types/ControlStockDetailsTypes';
import { GenderService } from '../../services/Gender.service';
import { Gender } from '../../types/gender';

// Interface para almacenar los resultados del escaneo
interface ScannedResult {
  value: string;
  timestamp: Date;
  bulksQuantity: number;
  saved?: boolean;
}

// Interfaz para enviar al crear un nuevo stock
interface CreateStockDto {
  NumBultos: number;
  CodigoPartida: number;
  IdGenero: number;
  Categoria: string;
  idControl: number;
  FechaCreacion?: string; // Añadido para manejar fechas explícitamente
}

// Interfaz extendida para actualizar partida en ERP
interface UpdatePartidaDto extends PutIdPartidaDto {
  idPartida: number;
  fechaCreacion?: string; // Añadido para manejar fechas explícitamente
}

// Interface para los datos de categoría
interface CategoriaData {
  name: string;
  count: number;
}

// Interface para los datos de género agrupados
interface GeneroAgrupado {
  idGenero: number;
  nombreGenero: string;
  count: number;
  nombreFamilia?: string; // Añadido para agrupar por familia
}

// Interface para los datos de categoría agrupados
interface CategoriaAgrupada {
  categoria: string;
  count: number;
  porcentaje: number;
}

@Component({
  selector: 'app-stock-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './stock-details.component.html',
  styleUrl: './stock-details.component.css'
})
export class StockDetailsComponent implements OnInit {
  @ViewChild('scanner') scanner!: ZXingScannerComponent;
  activeTab: 'Analisis de Stock' | 'Lectura de Stock' = 'Analisis de Stock';
  stock: StockDto | null = null;
  loading = true;
  error: string | null = null;
  
  // ID de control obtenido de la URL
  idControl: number | null = null;

  // PARA EL ESCÁNER
  scannerEnabled = false;
  qrResult: string | null = null;
  
  // Para el modal de cantidad de bultos
  showBulkQuantityModal = false;
  pendingQrResult: string = '';
  bulksQuantity: number = 1;
  
  // Para la linterna
  torchEnabled = false;
  torchAvailable = false;
  scanActive = false;
  
  // Tema oscuro
  isDarkMode = false;
  
  // Historial de resultados de escaneo (el más reciente primero)
  scannedResults: ScannedResult[] = [];

  // DISPOSITIVOS DE CÁMARA
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice: MediaDeviceInfo | undefined;
  
  // Variables para responsive
  screenWidth: number = 0;
  baseCardSize: number = 160; // Tamaño base en píxeles
  
  // Variables para la sección de análisis y edición
  searchTerm: string = '';
  showSaveSuccess: boolean = false;
  showEditBulkModal: boolean = false;
  currentEditScan: ScannedResult | null = null;
  currentEditIndex: number = -1;
  editBulksQuantity: number = 1;

  // Offset de la zona horaria local en minutos
  private timezoneOffset: number = new Date().getTimezoneOffset() * -1;
  
  // Datos para el análisis (se llenarán desde la API)
  stockDetails: any[] = []; // Datos crudos de la API
  generoData: Gender[] = [];
  categoriaData: CategoriaData[] = [];
  generos: Gender[] = [];
  generosUnicos: GeneroAgrupado[] = [];
  categoriasAgrupadas: CategoriaAgrupada[] = [];

  // Variables para el filtrado de familias y categorías
  familias: string[] = []; // Lista de familias únicas
  selectedFamilia: string | null = null; // Familia seleccionada
  selectedGenero: number | null = null; // Género seleccionado
  categoriasPorGenero: CategoriaAgrupada[] = []; // Categorías filtradas por género



  private audioCtx?: AudioContext;

  constructor(
    private stockService: StockService,
    private stockDetailsService: ControlStockDetailsService,
    private route: ActivatedRoute,
    private generoService: GenderService
  ) {
    this.screenWidth = window.innerWidth;
  }

  // Detectar cambios en el tamaño de la ventana
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.screenWidth = window.innerWidth;
  }

  ngOnInit(): void { 
    // Get the ID from the URL
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && !isNaN(parseInt(id))) {
        this.idControl = parseInt(id);
        console.log('ID de control obtenido de la URL:', this.idControl);
        
        // Primero, cargar los géneros para tener referencia
        this.loadGeneros(() => {
          // Después cargar el stock y detalles
          this.loadStock();
          this.loadStockDetails();
        });
      } else {
        this.error = 'ID de control no válido en la URL';
        this.loading = false;
      }
    });
    
    // Detect initial dark mode
    this.checkDarkMode();
    
    // Request camera permission explicitly when starting
    this.requestCameraPermission();
  }

  private initAudioContext(): void {
  if (!this.audioCtx) {
    this.audioCtx = new AudioContext();
  }
}
  
  // Método para cargar géneros con callback
  private loadGeneros(onComplete?: () => void): void {
    this.generoService.get().subscribe({
      next: (data) => {
        this.generoData = data;
        console.log('Géneros cargados:', this.generoData);
        if (onComplete) onComplete();
      },
      error: (error) => {
        console.log('Error al cargar géneros:', error);
        this.error = 'Error al cargar géneros. Algunos datos pueden no mostrarse correctamente.';
        if (onComplete) onComplete(); // Continuar aunque haya error
      }
    });
  }

  // Método para solicitar permisos de cámara 
  private requestCameraPermission(): void {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        console.log('Permiso de cámara concedido');
        // Stop the stream after getting permission
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        console.error('Error al solicitar permiso de cámara:', err);
        this.error = 'No se pudo acceder a la cámara. Verifica los permisos.';
      });
  }

  // Helper method to adjust dates to local timezone
  private adjustDateToLocalTimezone(date: Date | string): Date {
    let adjustedDate: Date;
    
    if (typeof date === 'string') {
      adjustedDate = new Date(date);
    } else {
      adjustedDate = new Date(date);
    }
    
    // Adjust for the timezone offset
    const userTimezoneOffset = 120; // 2 hours in minutes for your timezone (GMT+2)
    adjustedDate.setMinutes(adjustedDate.getMinutes() + userTimezoneOffset);
    
    return adjustedDate;
  }

  // Cargar la información del Stock principal usando el ID
  private loadStock(): void {
    if (!this.idControl) return;
    
    this.loading = true;
    // Buscar el stock específico por ID
    this.stockService.getStock().subscribe({
      next: (stocks) => {
        // Encontrar el stock con el ID correspondiente
        const matchingStock = stocks.find(s => s.id === this.idControl);
        if (matchingStock) {
          this.stock = matchingStock;
        } else {
          this.error = `No se encontró ningún stock con ID: ${this.idControl}`;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el stock:', err);
        this.error = 'Error al cargar la información del stock.';
        this.loading = false;
      }
    });
  }

  // Método para cargar los detalles del stock asociados al idControl
  private loadStockDetails(): void {
    if (!this.idControl) return;
    
    this.loading = true;
    // Obtener detalles del stock filtrados por idControl
    this.stockDetailsService.getAll().subscribe({
      next: (datos: any[]) => {
        // Filtrar solo los detalles que corresponden a este idControl
        this.stockDetails = datos.filter(d => d.idControl === this.idControl);
        console.log('Datos filtrados:', this.stockDetails);
        
        // Mapear a ScannedResult para la pestaña de lectura
        this.scannedResults = this.stockDetails.map(d => ({
          value: d.codigoPartida,
          timestamp: this.adjustDateToLocalTimezone(d.fechaCreacion),
          bulksQuantity: d.numBultos,
          saved: true // Los datos cargados desde la DB ya están guardados
        }));
        
        // Procesar los datos para el análisis
        this.processGeneroData();
        this.processCategoriaData();
        
        // Cargar las familias disponibles
        this.loadFamilias();
        
        // Inicializar categorías con todas las categorías
        this.categoriasPorGenero = [...this.categoriasAgrupadas];
        
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar detalles desde API', err);
        this.error = 'Error al cargar los detalles del stock.';
        this.loading = false;
        // Fallback a localStorage si quieres
        this.loadSavedResults();
      }
    });
  }
  
  // MÉTODO NUEVO: Cargar las familias únicas
  loadFamilias(): void {
    // Inicializar array
    this.familias = [];
    
    // Crear conjunto para evitar duplicados
    const familiasSet = new Set<string>();
    
    // Recopilar todas las familias de géneros
    this.generoData.forEach(genero => {
      if (genero.nombreFamilia) {
        familiasSet.add(genero.nombreFamilia);
      }
    });
    
    // Convertir a array y ordenar
    this.familias = Array.from(familiasSet).sort();
    
    // Añadir opción "Todas las familias"
    this.familias.unshift('Todas');
    console.log('Familias cargadas:', this.familias);
  }
  
  // MÉTODO NUEVO: Cuando cambia la familia seleccionada
  onFamiliaChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const familia = selectElement.value;
    this.selectedFamilia = familia === 'Todas' ? null : familia;
    this.selectedGenero = null; // Resetear el género seleccionado
    this.categoriasPorGenero = [...this.categoriasAgrupadas]; // Resetear a todas las categorías
  }
  
  // MÉTODO NUEVO: Cuando se selecciona un género
  onGeneroSelected(genero: GeneroAgrupado): void {
    this.selectedGenero = genero.idGenero;
    // Filtrar categorías solo para este género específico
    this.filterCategoriasByGenero(genero.idGenero);
  }
  
  // MÉTODO NUEVO: Filtrar categorías por género específico seleccionado
  filterCategoriasByGenero(idGenero: number): void {
    // Filtrar stockDetails para obtener solo los items de ese género
    const itemsFiltrados = this.stockDetails.filter(item => 
      Number(item.idGenero) === idGenero
    );
    
    // Agrupar por categoría
    const categoriaMap = new Map<string, number>();
    let totalBultos = 0;
    
    itemsFiltrados.forEach(item => {
      const categoriaName = item.categoria || "Sin categoría";
      const numBultos = Number(item.numBultos) || 0;
      
      totalBultos += numBultos;
      
      const currentCount = categoriaMap.get(categoriaName) || 0;
      categoriaMap.set(categoriaName, currentCount + numBultos);
    });
    
    // Convertir el mapa a un array para la tabla
    this.categoriasPorGenero = Array.from(categoriaMap.entries()).map(([categoria, count]) => ({
      categoria,
      count,
      porcentaje: totalBultos > 0 ? Math.round((count / totalBultos) * 100) : 0
    }));
    
    // Si no hay datos, añadir un valor por defecto
    if (this.categoriasPorGenero.length === 0) {
      const genero = this.generoData.find(g => g.idGenero === idGenero);
      const nombreGenero = genero ? genero.nombreGenero : `Género ${idGenero}`;
      
      this.categoriasPorGenero = [
        { categoria: `Sin datos para ${nombreGenero}`, count: 0, porcentaje: 0 }
      ];
    }
    
    console.log('Categorías filtradas por género:', this.categoriasPorGenero);
  }
  
  // MÉTODO NUEVO: Procesar datos para géneros
  processGeneroData(): number {
    // Inicializar arrays
    this.generos = [];
    this.generosUnicos = [];
    
    if (!this.generoData || this.generoData.length === 0) {
      console.warn('No hay datos de géneros disponibles');
      return 0;
    }
    
    // Crear un mapa para contabilizar bultos por género
    const conteoGeneros = new Map<number, number>();
    
    // Primero, contar todos los bultos por género que aparecen en stockDetails
    if (this.stockDetails && this.stockDetails.length > 0) {
      for (const item of this.stockDetails) {
        // Convertir a número para evitar problemas de tipo
        const idGenero = Number(item.idGenero);
        const numBultos = Number(item.numBultos) || 0;
        
        if (!isNaN(idGenero)) {
          const actual = conteoGeneros.get(idGenero) || 0;
          conteoGeneros.set(idGenero, actual + numBultos);
        }
      }
    }
    
    // Ahora, incluir TODOS los géneros de la base de datos
    const generosMap = new Map<number, GeneroAgrupado>();
    
    // Procesar todos los géneros de la BD
    for (const genero of this.generoData) {
      const idGenero = Number(genero.idGenero);
      const nombreFamilia = genero.nombreFamilia || 'Sin familia';
      
      // Crear el objeto de género agrupado
      const generoAgrupado: GeneroAgrupado = {
        idGenero: idGenero,
        nombreGenero: genero.nombreGenero || 'Desconocido',
        count: conteoGeneros.get(idGenero) || 0, // Si no hay datos en stockDetails, será 0
        nombreFamilia: nombreFamilia // Guardar también el nombre de la familia
      };
      
      // Guardar en el mapa
      generosMap.set(idGenero, generoAgrupado);
    }
    
    // Convertir el mapa a array para mostrar en la UI
    this.generosUnicos = Array.from(generosMap.values());
    
    // Si no hay géneros, añadir uno por defecto
    if (this.generosUnicos.length === 0) {
      this.generosUnicos = [{
        idGenero: 0,
        nombreGenero: 'Sin datos',
        count: 0,
        nombreFamilia: 'Sin familia'
      }];
    }
    
    console.log('Géneros procesados:', this.generosUnicos);
    return this.generosUnicos.length;
  }
  
  // MÉTODO NUEVO: Obtener géneros filtrados por familia seleccionada
  getGenerosPorFamilia(): GeneroAgrupado[] {
    if (!this.selectedFamilia || this.selectedFamilia === 'Todas') {
      // Si no hay familia seleccionada o se eligió "Todas", mostrar todos los géneros
      return this.generosUnicos;
    }
    
    // Filtrar por la familia seleccionada
    return this.generosUnicos.filter(g => g.nombreFamilia === this.selectedFamilia);
  }
  
  // MÉTODO NUEVO: Procesar datos para categorías
  processCategoriaData(): void {
    // Agrupar por categoría y contar
    const categoriaMap = new Map<string, number>();
    let totalBultos = 0;

    this.stockDetails.forEach(item => {
      // Usar la categoría de los datos o un valor por defecto si está vacío
      const categoriaName = item.categoria || "Sin categoría";
      const numBultos = item.numBultos || 0;
      
      totalBultos += numBultos;
      
      const currentCount = categoriaMap.get(categoriaName) || 0;
      categoriaMap.set(categoriaName, currentCount + numBultos);
    });
    
    // Convertir el mapa a un array para las tablas y gráficos
    this.categoriaData = Array.from(categoriaMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
    
    // Calcular porcentajes para cada categoría
    this.categoriasAgrupadas = Array.from(categoriaMap.entries()).map(([categoria, count]) => ({
      categoria,
      count,
      porcentaje: totalBultos > 0 ? Math.round((count / totalBultos) * 100) : 0
    }));

    // Si no hay datos, crear algunos por defecto
    if (this.categoriaData.length === 0) {
      this.categoriaData = [
        { name: "Sin datos", count: 0 }
      ];
      
      this.categoriasAgrupadas = [
        { categoria: "Sin datos", count: 0, porcentaje: 0 }
      ];
    }
    
    console.log('Categorías procesadas:', this.categoriasAgrupadas);
  }
  
  // MÉTODO NUEVO: Calcular el porcentaje del total para la tabla
  calculatePercentage(type: string, item: any): string {
    const totalBultos = this.getTotalBulks();
    if (totalBultos === 0) return '0';
    
    // Para el caso de géneros con la nueva estructura
    if (type === 'genero') {
      // Ya tenemos el count precalculado en el objeto
      const itemCount = item.count || 0;
      const percentage = (itemCount / totalBultos) * 100;
      return percentage.toFixed(1); // Redondear a 1 decimal
    } 
    // Para categorías, el método original funciona bien
    else if (type === 'categoria') {
      const categoria = item.categoria || 'Sin categoría';
      const itemCount = this.stockDetails
        .filter(d => (d.categoria || 'Sin categoría') === categoria)
        .reduce((total, d) => total + (Number(d.numBultos) || 0), 0);
      
      const percentage = (itemCount / totalBultos) * 100;
      return percentage.toFixed(1);
    }
    
    return '0';
  }
  
  // MÉTODO NUEVO: Procesar datos de análisis a partir de los resultados escaneados
  private processDataFromScannedResults(): void {
    // Convertir los resultados escaneados a un formato similar al de la API
    this.stockDetails = this.scannedResults.map(scan => {
      // Extraer el código numérico del QR
      const match = scan.value.match(/\.([0-9]+)\*?$/);
      const codigoNum = match ? parseInt(match[1], 10) : 0;

      return {
        codigoPartida: scan.value,
        numBultos: scan.bulksQuantity,
        idGenero: 0, // Valor por defecto si no hay info de género
        categoria: "", // Valor por defecto si no hay categoría
        idControl: this.idControl
      };
    });

    // Una vez convertidos, procesamos para análisis
    this.processGeneroData();
    this.processCategoriaData();
    
    // Cargar las familias disponibles
    this.loadFamilias();
  }

  // Método para cargar resultados guardados
  private loadSavedResults(): void {
    const savedResults = localStorage.getItem('scannedQrResults');
    if (savedResults) {
      try {
        // Convertir las cadenas de fecha a objetos Date
        const parsed = JSON.parse(savedResults);
        this.scannedResults = parsed.map((item: any) => ({
          value: item.value,
          timestamp: this.adjustDateToLocalTimezone(item.timestamp),
          bulksQuantity: item.bulksQuantity || 1,
          saved: item.saved || false
        }));
        
        // Crear datos de análisis a partir de los resultados guardados
        this.processDataFromScannedResults();
      } catch (e) {
        console.error('Error al cargar resultados guardados:', e);
      }
    }
  }

  // Cambiar la pestaña activa
  setActiveTab(tab: 'Analisis de Stock' | 'Lectura de Stock'): void {
    this.activeTab = tab;
    // Cerrar el escáner si cambiamos a otra pestaña
    if (tab !== 'Lectura de Stock') {
      this.closeScanner();
    }
    
    // Actualizar los datos si cambiamos a la pestaña de análisis
    if (tab === 'Analisis de Stock') {
      // Actualizar los datos de análisis
      this.processGeneroData();
      this.processCategoriaData();
      this.loadFamilias();
    }
  }

  // Método para exportar a PDF
  exportToPdf(): void { 
    // Implementar la lógica de exportación a PDF
    console.log('Exportando a PDF...');
  }

  // Método mejorado para activar/desactivar el escáner
  toggleScanner(): void {
    this.initAudioContext();
    this.scannerEnabled = !this.scannerEnabled;

    if (this.scannerEnabled) {
      // Esperamos un tick para que Angular inserte el <zxing-scanner> en el DOM
      setTimeout(() => {
        // Si el componente del scanner está disponible, pedimos permiso
        if (this.scanner) {
          this.scanner.askForPermission();
        }
      }, 0);
    } else {
      this.closeScanner();
    }
  }

  // Método seguro para cerrar el escáner
  closeScanner(): void {
    this.scannerEnabled = false;
    this.torchEnabled = false;
    this.scanActive = false;
    this.error = null;
  }

  // Método para alternar la linterna (flash)
  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  // Método para manejar cambios en la selección del dispositivo
  onDeviceSelectChange(): void {
    // Resetear error al cambiar de dispositivo
    this.error = null;
    
    // Verificar si el nuevo dispositivo seleccionado tiene flash
    this.checkTorchAvailability();
  }

  // Método para comprobar si la linterna está disponible
  checkTorchAvailability(): void {
    if (this.selectedDevice && this.selectedDevice.label) {
      // La mayoría de las cámaras traseras tienen flash
      this.torchAvailable = this.selectedDevice.label.toLowerCase().includes('back') || 
                           this.selectedDevice.label.toLowerCase().includes('trasera') ||
                           this.selectedDevice.label.toLowerCase().includes('rear');
    } else {
      this.torchAvailable = false;
    }
  }

  // Método para manejar el resultado del escaneo QR
  onQrCodeDetected(resultString: string): void {
    // Pausar el escáner
    this.scannerEnabled = false;
    
    // Almacenar el resultado temporalmente
    this.pendingQrResult = resultString;
    
    // Mostrar el modal para ingresar la cantidad de bultos
    this.bulksQuantity = 1; // Resetear a valor por defecto
    this.showBulkQuantityModal = true;
    
    // Reproducir sonido de éxito (opcional)
    this.playSuccessSound();
  }
  
  // Para mantener compatibilidad con el código anterior
  onCodeResult(resultString: string): void {
    this.onQrCodeDetected(resultString);
  }
  
  // Incrementar la cantidad de bultos
  incrementBulks(): void {
    this.bulksQuantity++;
  }
  
  // Decrementar la cantidad de bultos (mínimo 1)
  decrementBulks(): void {
    if (this.bulksQuantity > 1) {
      this.bulksQuantity--;
    }
  }
  
  // Cancelar la entrada de bultos
  cancelBulkEntry(): void {
    this.showBulkQuantityModal = false;
    this.pendingQrResult = '';
    this.bulksQuantity = 1;
  }
  
  // Guardar la cantidad de bultos y el resultado del escaneo
  saveBulkQuantity(): void {
    if (!this.idControl) {
      this.error = 'ID de control inválido';
      return;
    }

    // Extraemos sólo los dígitos tras el último punto y sin '*'
    const match = this.pendingQrResult.match(/\.([0-9]+)\*?$/);
    const codigoNum = match ? parseInt(match[1], 10) : NaN;
    if (isNaN(codigoNum)) {
      this.error = 'QR con formato incorrecto';
      this.showBulkQuantityModal = false;
      return;
    }
    
    // Crear objeto con fecha actual explícita en formato ISO
    const fechaActual = new Date();
    
    const crearStock = {
      NumBultos: this.bulksQuantity,
      CodigoPartida: codigoNum,
      IdGenero: 0,
      Categoria: '',
      idControl: this.idControl,
      FechaCreacion: fechaActual.toISOString() // Añadir la fecha actual en formato ISO
    };
    
    console.log('Enviando fecha de creación:', fechaActual, fechaActual.toISOString());
    
    this.stockDetailsService.create(crearStock).subscribe(
      (data: any) => {
        console.log('Se ha creado correctamente', data);
        this.updatePartidaFromQr(codigoNum);
      },
      (error: any) => {
        console.error('Error al crear stock:', error);
        // Aún así, actualizamos la UI para no bloquear al usuario
        this.scannedResults.unshift({
          value: this.pendingQrResult,
          timestamp: fechaActual, // Usamos la misma fecha que enviamos al servidor
          bulksQuantity: this.bulksQuantity,
          saved: false // Marcado como no guardado
        });
        this.showBulkQuantityModal = false;
        this.pendingQrResult = '';
        // Mostrar mensaje de error
        this.error = 'Error al guardar en la base de datos';
      }
    );
  }

  // Método secundario que hace el PUT a ERP usando el número del QR
  private updatePartidaFromQr(codigoNum: number): void {
    const fechaActual = new Date();
    
    this.stockDetailsService
      .updatePartidaErp(codigoNum, { 
        idPartida: codigoNum,
        //fechaCreacion: fechaActual.toISOString() // Aseguramos de enviar la fecha actual
      })
      .subscribe({
        next: () => {
          // Todo OK: actualizamos la UI
          this.scannedResults.unshift({
            value: this.pendingQrResult,
            timestamp: fechaActual, // Usamos la misma fecha que enviamos al servidor
            bulksQuantity: this.bulksQuantity,
            saved: true // Marcado como guardado
          });
          this.showBulkQuantityModal = false;
          this.pendingQrResult = '';
          this.showSaveSuccess = true;
          // Ocultar mensaje después de 3 segundos
          setTimeout(() => {
            this.showSaveSuccess = false;
          }, 3000);
          // Recargar todos los datos
          this.loadStockDetails();
        },
        error: () => {
          this.error = 'Fallo al actualizar ERP';
          this.showBulkQuantityModal = false;
          // Aún así, actualizamos la UI para no bloquear al usuario
          this.scannedResults.unshift({
            value: this.pendingQrResult,
            timestamp: fechaActual, // Usamos la misma fecha que enviamos al servidor
            bulksQuantity: this.bulksQuantity,
            saved: false // Marcado como no guardado
          });
        }
      });
  }

  // Método para reproducir un sonido de éxito (opcional)
  playSuccessSound(): void {
  if (!this.audioCtx) {
    // tiene que existir porque lo inicializas en el primer click
    return;
  }
  const duration = 0.2;           // segundos
  const frequency = 840;          // hertz (A4)
  const oscillator = this.audioCtx.createOscillator();
  const gainNode   = this.audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

  // envolvente rápida para evitar clicks fuertes
  gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, this.audioCtx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(this.audioCtx.destination);

  oscillator.start(this.audioCtx.currentTime);
  oscillator.stop(this.audioCtx.currentTime + duration + 0.02);
}
  // Eliminar un resultado del historial
  removeResult(index: number, event?: Event): void {
    // Stop propagation to avoid triggering the scanner
    if (event) {
      event.stopPropagation();
    }
    
    const itemToRemove = this.scannedResults[index];
    
    // Find the corresponding ID in the database to delete it
    this.stockDetailsService.getAll().subscribe({
      next: (datos: any[]) => {
        // Find the element that matches the scanned one (by partition code and quantity)
        const matchingItem = datos.find(d => 
          d.codigoPartida === itemToRemove.value && 
          d.numBultos === itemToRemove.bulksQuantity &&
          d.idControl === this.idControl
        );
        
        if (matchingItem) {
          // Delete from the database
          this.stockDetailsService.delete(matchingItem.id).subscribe({
            next: () => {
              console.log('Elemento eliminado de la base de datos');
              // Only remove locally AFTER successful API deletion
              this.performLocalRemove(index);
            },
            error: (err: any) => {
              console.error('Error al eliminar de la base de datos:', err);
              this.error = 'No se pudo eliminar el elemento del servidor. Inténtalo de nuevo.';
              // Do NOT remove from local view if API delete fails
            }
          });
        } else {
          console.warn('No se encontró el elemento en la base de datos');
          this.error = 'Este elemento no existe en el servidor. Actualiza la página.';
          // Consider refreshing from API here
          this.loadStockDetails();
        }
      },
      error: (err: any) => {
        console.error('Error al buscar el elemento a eliminar:', err);
        this.error = 'Error de comunicación con el servidor.';
      }
    });
  }
  
  // Función auxiliar para eliminar visualmente con animación
  private performLocalRemove(index: number): void {
    // Añadir clase de animación antes de eliminar
    const cardElement = document.querySelectorAll('.qr-result-card')[index] as HTMLElement;
    if (cardElement) {
      cardElement.classList.add('removing');
      
      // Esperar a que termine la animación
      setTimeout(() => {
        this.scannedResults.splice(index, 1);
        // Actualizar localStorage
        this.saveResults();
      }, 300);
    } else {
      // Si no encuentra el elemento, eliminar directamente
      this.scannedResults.splice(index, 1);
      this.saveResults();
    }
  }

  // Guardar resultados en localStorage
  private saveResults(): void {
    localStorage.setItem('scannedQrResults', JSON.stringify(this.scannedResults));
  }

  // Métodos para el tamaño dinámico de las tarjetas
  getAddCardWidth(): string {
    // La tarjeta de añadir (+) crece con la cantidad de resultados
    const baseWidth = this.getBaseCardWidth();
    const growFactor = Math.min(this.scannedResults.length * 0.05, 0.5); // Crecer hasta un 50% más
    
    return `${baseWidth + (baseWidth * growFactor)}px`;
  }
  
  getResultCardWidth(): string {
    return `${this.getBaseCardWidth()}px`;
  }
  
  getCardHeight(): string {
    // Altura responsiva basada en el ancho de la pantalla
    const heightFactor = this.screenWidth < 640 ? 1.2 : 1.4;
    return `${this.getBaseCardWidth() * heightFactor}px`;
  }
  
  private getBaseCardWidth(): number {
    // Ajustar el tamaño base dependiendo del ancho de la pantalla
    if (this.screenWidth < 640) {
      return this.baseCardSize * 0.8; // Más pequeño en móviles
    } else if (this.screenWidth < 1024) {
      return this.baseCardSize * 0.9; // Tamaño medio en tablets
    } else {
      return this.baseCardSize; // Tamaño completo en desktop
    }
  }
  
  getCardWrapperWidth(): string {
    // Asegurar que el contenedor sea lo suficientemente ancho
    const totalCards = this.scannedResults.length + 1; // +1 por la tarjeta de añadir
    const gap = 16; // 4rem de gap entre tarjetas
    
    const addCardWidth = parseFloat(this.getAddCardWidth());
    const resultCardWidth = parseFloat(this.getResultCardWidth());
    
    const totalWidth = addCardWidth + (resultCardWidth * this.scannedResults.length) + (gap * (totalCards - 1));
    
    return `${totalWidth}px`;
  }

  // Eventos del escáner QR mejorados
  onPermissionResponse(hasPermission: boolean): void {
    console.log('¿Permiso para usar la cámara?', hasPermission);
    if (!hasPermission) {
      this.error = 'Necesito permiso para usar la cámara.';
    }
  }

  onScanError(err: any): void {
    console.error('Error al escanear:', err);
    
    // Mensaje más amigable para el usuario
    if (err.name === 'NotAllowedError') {
      this.error = 'Necesito permiso para usar la cámara.';
    } else if (err.name === 'NotFoundError') {
      this.error = 'No se pudo encontrar una cámara en tu dispositivo.';
    } else if (err.name === 'NotReadableError') {
      this.error = 'La cámara está siendo utilizada por otra aplicación.';
    } else {
      this.error = 'Error al acceder a la cámara: ' + (err.message || 'Verifica los permisos');
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    console.log('Cámaras detectadas:', devices);
    this.availableDevices = devices;
    
    if (!this.selectedDevice && devices.length > 0) {
      // Intentar seleccionar la cámara trasera por defecto (mejor para QR)
      const rearCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('trasera') ||
        d.label.toLowerCase().includes('rear')
      );
      this.selectedDevice = rearCamera || devices[0];
      
      // Verificar disponibilidad de linterna
      this.checkTorchAvailability();
    }
  }

  onCamerasNotFound(): void {
    console.warn('No se detectó ninguna cámara');
    this.availableDevices = [];
    this.error = 'No se detectó ninguna cámara en el dispositivo.';
  }

  // Método mejorado para reintentar el escaneo
  retryScanner(): void {
    this.error = null;
    
    // Reiniciar el escáner con una pequeña pausa
    setTimeout(() => {
      this.scannerEnabled = false;
      
      setTimeout(() => {
        this.scannerEnabled = true;
        
        // Volver a pedir permiso
        if (this.scanner) {
          this.scanner.askForPermission();
        }
      }, 100);
    }, 300);
  }

  // Método para detectar tema oscuro/claro
  checkDarkMode(): void {
    // Puedes adaptar esto según cómo manejes los temas en tu aplicación
    this.isDarkMode = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  // Métodos para la sección de análisis
  
   getTotalBulks(): number {
    if (!this.idControl) return 0;
    return this.stockDetails
      .filter(item => item.idControl === this.idControl)
      .reduce((sum, item) => sum + (Number(item.numBultos) || 0), 0);
  }
  // Filtrar resultados para la búsqueda
  get filteredResults(): ScannedResult[] {
    if (!this.searchTerm.trim()) {
      return [...this.scannedResults];
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    return this.scannedResults.filter(scan => 
      scan.value.toLowerCase().includes(term)
    );
  }
  
  // Editar cantidad de bultos
  editBulkQuantity(scan: ScannedResult, index: number): void {
    this.currentEditScan = scan;
    this.currentEditIndex = index;
    this.editBulksQuantity = scan.bulksQuantity || 1;
    this.showEditBulkModal = true;
  }
  
  // Cancelar edición de bultos
  cancelEditBulk(): void {
    this.showEditBulkModal = false;
    this.currentEditScan = null;
    this.currentEditIndex = -1;
  }
  
  // Incrementar bultos en edición
  incrementEditBulks(): void {
    this.editBulksQuantity++;
  }
  
  // Decrementar bultos en edición
  decrementEditBulks(): void {
    if (this.editBulksQuantity > 1) {
      this.editBulksQuantity--;
    }
  }
  
  // Actualizar la cantidad de bultos
  updateBulkQuantity(): void {
    if (!this.currentEditScan || this.currentEditIndex < 0) {
      return;
    }
    
    // Obtener el elemento original
    const originalScan = this.scannedResults[this.currentEditIndex];
    
    // Actualizar en la API solo si el elemento está guardado
    if (originalScan.saved) {
      this.stockDetailsService.getAll().subscribe({
        next: (datos: any[]) => {
          // Encontrar el elemento correspondiente
          const matchingItem = datos.find(d => 
            d.codigoPartida === originalScan.value && 
            d.numBultos === originalScan.bulksQuantity &&
            d.idControl === this.idControl
          );
          
          if (matchingItem) {
            // Actualizar en la base de datos
            const updateData = {
              ...matchingItem,
              numBultos: this.editBulksQuantity
            };
            
            this.stockDetailsService.update(matchingItem.id, updateData).subscribe({
              next: () => {
                // Actualizar localmente
                this.scannedResults[this.currentEditIndex].bulksQuantity = this.editBulksQuantity;
                this.showEditBulkModal = false;
                this.showSaveSuccess = true;
                
                // Ocultar mensaje después de 3 segundos
                setTimeout(() => {
                  this.showSaveSuccess = false;
                }, 3000);
                
                // Actualizar datos de análisis
                this.loadStockDetails();
              },
              error: (err: any) => {
                console.error('Error al actualizar en la base de datos:', err);
                this.error = 'No se pudo actualizar la cantidad en el servidor.';
                this.showEditBulkModal = false;
              }
            });
          } else {
            console.warn('No se encontró el elemento en la base de datos');
            this.error = 'Este elemento no existe en el servidor.';
            this.showEditBulkModal = false;
          }
        },
        error: (err: any) => {
          console.error('Error al buscar el elemento a actualizar:', err);
          this.error = 'Error de comunicación con el servidor.';
          this.showEditBulkModal = false;
        }
      });
    } else {
      // Si no está guardado, solo actualizamos localmente
      this.scannedResults[this.currentEditIndex].bulksQuantity = this.editBulksQuantity;
      this.showEditBulkModal = false;
      
      // Guardar en localStorage
      this.saveResults();
      
      // Actualizar datos de análisis
      this.processDataFromScannedResults();
    }
  }
   getGeneroFamilia(idGenero: number): string {
    const g = this.generoData.find(x => x.idGenero === idGenero);
    return g?.nombreGenero || 'Desconocido';
  }
  getVisibleGenerosCount(): number {
  return this.generosUnicos
    .filter(g => g.count > 0 && this.stockDetails.some(d => d.idGenero === g.idGenero && d.idControl === this.idControl))
    .length;
}
getVisibleCategoriasCount(): number {
  if (!this.idControl) return 0;
  return this.categoriasAgrupadas
    .filter(c => c.count > 0 &&
      this.stockDetails
        .filter(d => d.idControl === this.idControl)
        .some(d => (d.categoria || 'Sin categoría') === c.categoria)
    )
    .length;
}
}
