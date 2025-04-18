import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { FormsModule } from '@angular/forms';
import { ComercialServiceService, Comercial } from '../../services/Comercial.service';
import { GenderService } from '../../services/Gender.service';
import { ComercialPlanningService } from '../../services/ComercialPlanning.service';
import { ComercialPlanning } from '../../types/ComercialPlanning';
import { Chart } from 'chart.js';

import { ComercialPlanningDetailsService, ComercialPlanningDetailsWithId } from '../../services/ComercialPlanningDetails.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  constructor(private comercialServicio: ComercialServiceService, private generoServicio: GenderService, private planingComercial: ComercialPlanningService, private plannigSemanas: ComercialPlanningDetailsService) { }

  // Propiedades para los gráficos
  data: any;
  options: any;
  teoricaData: any;
  realData: any;
  teoricaOptions: any;
  realOptions: any;
  showCombined = false;
  combinedData: any;
  combinedOptions: any;



  // Objeto comercial
  comercial: Comercial = {
    id: 0,
    clientCode: 0,
    clientName: "",
    startDate: new Date(),
    endDate: new Date(),
    idGenero: 0,
    nombreGenero: "",
    kgs: 0
  }

  // Array de objetos comercial
  comNeeds: Comercial[] = [];
  planning: ComercialPlanning[] = [];
  planingDetails: ComercialPlanningDetailsWithId[] = [];
  // Propiedades adicionales para el nuevo diseño
  // Arrays para manejar los filtros de géneros y necesidades
  genders: any[] = [];
  selectedGenderIds: number[] = [];
  selectedComNeedIds: number[] = [];
  filteredComNeeds: Comercial[] = [];
  family: { familia: string, nombreGenero: string[] }[] = [];
  texto: string = '';
  familiaSeleccionada: string = '';
  // Métricas del dashboard
  dashboardMetrics = {
    totalRegistros: 0,
    variacionMensual: '+12%', // Valor de ejemplo
    plazoMedio: '28 días',    // Valor de ejemplo
    ultimaActualizacion: '24/06/2024'
  };
  seleccionados: number = 0;
  vistaSeleccionada: string = 'mes';

  ngOnInit(): void {
    // Obtenemos los registros de los datos de la base de datos
    this.comercialServicio.getComercial().subscribe(
      (data) => {
        this.comNeeds = data;
        this.filteredComNeeds = [...this.comNeeds]; // Inicialmente mostramos todos
        this.dashboardMetrics.totalRegistros = this.comNeeds.length;

      },
      (error) => {
        console.error('Error al cargar datos: ' + error);
      }
    );
    this.generoServicio.get().subscribe(
      (data) => {
        this.genders = data;

        this.extractGenders();
      },
      (error) => {
        console.log(error);
      }

    );
    this.planingComercial.get().subscribe(
      (data) => {
        this.planning = data;

      },
      (error) => {
        console.log(error);
      }


    );
    this.plannigSemanas.get().subscribe(
      (data) => {
        this.planingDetails = data;
      },
      (error) => {
        console.log(error);
      }
    )

  }

  // Método para extraer géneros únicos de los datos comerciales
  extractGenders() {


    for (let i = 0; i < this.genders.length; i++) {
      // Buscamos el objeto correspondiente al idGenero actual
      const generoEncontrado = this.genders[i];


      // Buscamos si ya existe un objeto en "this.family" para la familia encontrada
      const familiaExistente = this.family.find(f =>
        f.familia === generoEncontrado.nombreFamilia
      );

      if (familiaExistente) {
        // Si ya existe la familia, verificamos que el nombre de género no se haya agregado previamente.
        if (!familiaExistente.nombreGenero.includes(generoEncontrado.nombreGenero)) {
          familiaExistente.nombreGenero.push(generoEncontrado.nombreGenero);
        }
      } else {
        // Si no existe, creamos un nuevo objeto para esta familia con el nombre de género en un arreglo.
        this.family.push({
          familia: generoEncontrado.nombreFamilia,
          nombreGenero: [generoEncontrado.nombreGenero]
        });
      }

    }



  }

  // Inicializar las configuraciones de los gráficos
  initializeCharts() {
    const d = new Date();//Para saber el mes en el que estamos
    let genero: string;
    const checkboxes = document.querySelectorAll('input[type="radio"]');
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i] as HTMLInputElement;

      if (checkbox.checked) {
        genero = checkbox.value;

      }
    }

    const generosSeleccionados = this.comNeeds.filter(item => item.nombreGenero == genero);//Obtenemos las necesidades con el nombre de género especificado


    let planning: ComercialPlanning[] = [];
    let planningDetails: ComercialPlanningDetailsWithId[] = [];
    for (let i = 0; i < generosSeleccionados.length; i++) {
      const encontrado = this.planning.find(item => item.idCommercialNeed == generosSeleccionados[i].id);
      if (encontrado) {
        planning.push(encontrado);

      }
    }
    for (let i = 0; i < planning.length; i++) {


      if (this.planingDetails.find(item => item.idCommercialNeedsPlanning == planning[i].id)) {
        const encontrado = this.planingDetails.filter(item => item.idCommercialNeedsPlanning == planning[i].id);
        for (let j = 0; j < encontrado.length; j++) {
          planningDetails.push(encontrado[j]);

        }
      }
    }

    let mesActual = d.getMonth();


    let meses: number[] = [];
    for (let i = mesActual; i < (mesActual + 6); i++) {//Rellenamos el label
      meses.push(i + 1);

    }


    let kgs: number[] = new Array(meses.length).fill(0);
    let clientes: string[] = new Array(meses.length);
    let repetidos: { mes: number, cliente: string }[] = [];
    for (let i = 0; i < planningDetails.length; i++) {//para ir sumando los kg de cada semana

      //Necesitamos saber en que mes entra la planificación de la necesidad
      const mes = new Date(planningDetails[i].fechaDesde);


      for (let j = 0; j < meses.length; j++) {
        if (mes.getMonth() + 1 == meses[j]) {
          //Saber los clientes que estan en la semana de la necesidad
          const id = this.planning.find(item => item.id == planningDetails[i].idCommercialNeedsPlanning);
          const client = this.comNeeds.find(item => item.id == id?.idCommercialNeed)
          if (!repetidos.find(item => item.mes == j && item.cliente == client?.clientName)) {
            clientes[j] = (clientes[j] || '') + client?.clientName + '-';
            repetidos.push({ mes: j, cliente: client?.clientName ?? '' })
          }
          kgs[j] = (kgs[j] || 0) + planningDetails[i].kilos;//Si los kilos estan vacios lo ponemos a 0.

        }
      }

    }
    let label: string[] = [];
    for (let i = 0; i < meses.length; i++) {
      switch (meses[i]) {
        case 1:
          label.push('Enero');
          break;
        case 2:
          label.push('Febrero');
          break;
        case 3:
          label.push('Marzo');
          break;
        case 4:
          label.push('Abril');
          break;
        case 5:
          label.push('Mayo');
          break;
        case 6:
          label.push('Junio');
          break;
        case 7:
          label.push('Julio');
          break;
        case 8:
          label.push('Agosto');
          break;
        case 9:
          label.push('Septiembre');
          break;
        case 10:
          label.push('Octubre');
          break;
        case 11:
          label.push('Noviembre');
          break;
        case 12:
          label.push('Diciembre');
      }
    }


    // Configuraciones para gráficos de barra     
    const barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 20,
            color: '#64748b'
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        x: {
          type: 'category',
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            autoSkip: false   // Para mostrar todas las etiquetas       
          },
          offset: true,
          distribution: 'series'  // Distribuir uniformemente
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#334155',
            font: {
              weight: '500'
            }
          }
        }
      }
    };

    // Gráfico principal     
    this.data = {
      labels: label,
      datasets: [
        {
          label: 'Dataset 1',
          data: label.map((_, i) => kgs[i] ?? null),
          borderColor: '#4f46e5', // Color indigo para Tailwind           
          tension: 0.4,
          spanGaps: true,
          yAxisID: 'y'
        },
        {
          label: 'Dataset 2',
          data: kgs,
          borderColor: '#10b981', // Color emerald para Tailwind           
          tension: 0.4,
          spanGaps: true,
          yAxisID: 'y1'
        }
      ]
    };

    this.options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            stepSize: 10,
            color: '#64748b'
          },
          grid: {
            drawOnChartArea: true,
            color: '#e2e8f0'
          },
          beginAtZero: true,  // Asegura que el eje Y comience en 0
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          ticks: {
            stepSize: 10,
            color: '#64748b'
          },
          grid: {
            drawOnChartArea: false
          },
          beginAtZero: true,  // Asegura que el eje Y secundario también comience en 0
        },
        x: {
          type: 'category',
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            autoSkip: false,          // Asegurar que se muestren todas las etiquetas
            maxRotation: 0            // Evitar rotación de etiquetas
          },
          offset: true,               // Mejor distribución de puntos
          distribution: 'series',     // Distribución uniforme de etiquetas
          bounds: 'ticks'             // Asegurar que el rango completo se muestre
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#334155'         // Color de las etiquetas en la leyenda
          }
        },
        tooltip: {
          enabled: true,  // Habilitar tooltips
          mode: 'nearest', // Mostrar tooltip sobre el punto más cercano
          intersect: false, // Para mostrar tooltips cuando el cursor esté sobre cualquier punto
          callbacks: {

            // Personalización de las etiquetas del tooltip
            label: function (tooltipItem: any) {
              // tooltipItem tiene acceso a todos los datos del punto seleccionado

              let dataValue = tooltipItem.raw;  // Valor del punto
              // Accede al índice del punto de datos seleccionado
              let index = tooltipItem.dataIndex;

              // Accede al cliente correspondiente usando el índice
              let cliente = clientes[index];  // Asumiendo que 'clientes' es un array con los nombres de los clientes



              // Crear un mensaje personalizado con los datos
              return `Semana: ${cliente} - Kilos: ${dataValue}`;
            }
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 10
          }
        }
      }
    };

    // Gráficos teórica y real
    this.teoricaData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Teórica',
          data: [65, 59, 80, 81],
          backgroundColor: '#4f46e5',
          borderColor: '#4f46e5',
          tension: 0.4,
          fill: false
        }
      ]
    };

    this.realData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Real',
          data: [28, 48, 40, 19],
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          tension: 0.4,
          fill: false
        }
      ]
    };

    this.teoricaOptions = { ...barOptions };
    this.realOptions = { ...barOptions };

    // Configuración gráfica combinada
    this.combinedData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Teórica',
          data: [65, 59, 80, 81],
          borderColor: '#4f46e5',
          tension: 0.4,
          fill: false,
          borderWidth: 2
        },
        {
          label: 'Real',
          data: [28, 48, 40, 19],
          borderColor: '#10b981',
          tension: 0.4,
          fill: false,
          borderWidth: 2,
          borderDash: [5, 5]
        }
      ]
    };

    this.combinedOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 20,
            color: '#64748b',
            font: {
              size: window.innerWidth < 768 ? 10 : 12
            }
          },
          grid: {
            color: '#e2e8f0',
            drawOnChartArea: true
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: window.innerWidth < 768 ? 10 : 12
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#64748b',
            font: {
              size: window.innerWidth < 768 ? 12 : 14
            }
          }
        }
      }
    };

    // Forzar actualizaciones iniciales
    this.updateChartOptions();
  }



  // Método para actualizar gráficos con los datos filtrados
  updateChartWithFilteredData() {
    // Simular valores diferentes para gráficos basados en el producto seleccionado
    const multiplier = (Math.random() * 0.5) + 0.75; // Factor entre 0.75 y 1.25

    const updatedTeoricaData = this.teoricaData.datasets[0].data.map((val: number) =>
      Math.round(val * multiplier)
    );

    const updatedRealData = this.realData.datasets[0].data.map((val: number) =>
      Math.round(val * (multiplier * 0.8))
    );

    // Actualizar datasets
    this.teoricaData.datasets[0].data = updatedTeoricaData;
    this.realData.datasets[0].data = updatedRealData;
    this.combinedData.datasets[0].data = updatedTeoricaData;
    this.combinedData.datasets[1].data = updatedRealData;

    // Forzar actualización de los gráficos
    this.teoricaData = { ...this.teoricaData };
    this.realData = { ...this.realData };
    this.combinedData = { ...this.combinedData };
  }

  // Alternar vista de gráficos
  toggleView() {
    this.showCombined = !this.showCombined;
  }

  // Métodos para manejar los nuevos checkboxes de selección
  toggleAllGenders(event: any) {
    if (event.target.checked) {
      this.selectedGenderIds = this.genders.map(g => g.idGenero);
    } else {
      this.selectedGenderIds = [];
    }

  }

  toggleAllComNeeds(event: any) {
    if (event.target.checked) {
      this.selectedComNeedIds = this.comNeeds.map(n => n.id);
    } else {
      this.selectedComNeedIds = [];
    }

  }

  toggleGenderSelection(generoId: number) {
    const index = this.selectedGenderIds.indexOf(generoId);
    if (index > -1) {
      this.selectedGenderIds.splice(index, 1);
    } else {
      this.selectedGenderIds.push(generoId);
    }

  }

  toggleComNeedSelection(needId: number) {
    const index = this.selectedComNeedIds.indexOf(needId);
    if (index > -1) {
      this.selectedComNeedIds.splice(index, 1);
    } else {
      this.selectedComNeedIds.push(needId);
    }

  }

  // Actualizar datos filtrados basados en selecciones


  // Calcular total de KGs (para el panel de información)
  getTotalKgs(): number {
    let genero = '';
    const checkboxes = document.querySelectorAll('input[type="radio"]');
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i] as HTMLInputElement;

      if (checkbox.checked) {
        genero = checkbox.value;

      }
    }

    const generosSeleccionados = this.comNeeds.filter(item => item.nombreGenero == genero);
    let suma = 0;
    for (let i = 0; i < generosSeleccionados.length; i++) {
      suma += generosSeleccionados[i].kgs;
    }

    return suma;
  }

  // Actualizar opciones de gráficos para responsive
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateChartOptions();
  }

  updateChartOptions() {
    const isMobile = window.innerWidth < 768;
    const baseSize = isMobile ? 10 : 12;

    this.combinedOptions = {
      ...this.combinedOptions,
      plugins: {
        legend: {
          labels: {
            font: {
              size: isMobile ? 12 : 14
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            font: {
              size: baseSize
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: baseSize
            }
          }
        }
      }
    };

    // Actualizar también opciones de otros gráficos
    //this.teoricaOptions.plugins.legend.labels.font = { size: isMobile ? 12 : 14 };
    //this.realOptions.plugins.legend.labels.font = { size: isMobile ? 12 : 14 };

    // Forzar actualización de las gráficas
    this.data = { ...this.data };
    this.combinedData = { ...this.combinedData };
    this.teoricaData = { ...this.teoricaData };
    this.realData = { ...this.realData };
  }
  get busquedaFamilia() {
    const familia = this.familiaSeleccionada.toLowerCase().trim();
    if (!this.texto && familia === 'todas') {
      return this.family;
    }
    if (!this.texto && familia != 'todas') {
      return this.family.filter(item =>
        item.familia.toLowerCase().includes(familia)
      );
    }
    const termino = this.texto.toLowerCase();

    return this.family.filter(item =>
      item.familia.toLowerCase().includes(termino) ||
      item.nombreGenero.some(nombre => nombre.toLowerCase().includes(termino))
    );

  }
  borrarFiltros() {
    this.texto = '';
    this.familiaSeleccionada = '';
    const checkboxes = document.querySelectorAll('input[type="radio"]');
    for (let i = 0; i < checkboxes.length; i++) {
      let checkbox = checkboxes[i] as HTMLInputElement;
      checkbox.checked = false;
    }
    this.seleccionados = 0;
  }

  contarSeleccionados() {//Para contar los géneros seleccionados
    this.seleccionados = 0;
    const checkboxes = document.querySelectorAll('input[type="radio"]');
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i] as HTMLInputElement;

      if (checkbox.checked) {
        this.seleccionados++;
      }
    }
    // Configuración inicial de gráficos
    this.initializeCharts();
  }
  actualizarGrafica(vista: string) {
    let genero: string;
    const checkboxes = document.querySelectorAll('input[type="radio"]');
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i] as HTMLInputElement;

      if (checkbox.checked) {
        genero = checkbox.value;

      }
    }

    const generosSeleccionados = this.comNeeds.filter(item => item.nombreGenero == genero);//Obtenemos las necesidades con el nombre de género especificado


    let planning: ComercialPlanning[] = [];
    let planningDetails: ComercialPlanningDetailsWithId[] = [];
    for (let i = 0; i < generosSeleccionados.length; i++) {
      const encontrado = this.planning.find(item => item.idCommercialNeed == generosSeleccionados[i].id);
      if (encontrado) {
        planning.push(encontrado);

      }
    }
    for (let i = 0; i < planning.length; i++) {


      if (this.planingDetails.find(item => item.idCommercialNeedsPlanning == planning[i].id)) {
        const encontrado = this.planingDetails.filter(item => item.idCommercialNeedsPlanning == planning[i].id);
        for (let j = 0; j < encontrado.length; j++) {
          planningDetails.push(encontrado[j]);

        }
      }
    }
    switch (vista) {
      case 'mes':
        this.vistaSeleccionada = 'mes';
        const d = new Date();//Para saber el mes en el que estamos


        let mesActual = d.getMonth();


        let meses: number[] = [];
        for (let i = mesActual; i < (mesActual + 6); i++) {//Rellenamos el label
          meses.push(i + 1);

        }


        let kgs: number[] = new Array(meses.length).fill(0);
        let clientes: string[] = new Array(meses.length);
        let repetidos: { mes: number, cliente: string }[] = [];
        for (let i = 0; i < planningDetails.length; i++) {//para ir sumando los kg de cada semana

          //Necesitamos saber en que mes entra la planificación de la necesidad
          const mes = new Date(planningDetails[i].fechaDesde);


          for (let j = 0; j < meses.length; j++) {
            if (mes.getMonth() + 1 == meses[j]) {
              //Saber los clientes que estan en la semana de la necesidad
              const id = this.planning.find(item => item.id == planningDetails[i].idCommercialNeedsPlanning);
              const client = this.comNeeds.find(item => item.id == id?.idCommercialNeed)
              if (!repetidos.find(item => item.mes == j && item.cliente == client?.clientName)) {
                clientes[j] = (clientes[j] || '') + client?.clientName + '-';
                repetidos.push({ mes: j, cliente: client?.clientName ?? '' })
              }
              kgs[j] = (kgs[j] || 0) + planningDetails[i].kilos;//Si los kilos estan vacios lo ponemos a 0.

            }
          }

        }
        let label: string[] = [];
        for (let i = 0; i < meses.length; i++) {
          switch (meses[i]) {
            case 1:
              label.push('Enero');
              break;
            case 2:
              label.push('Febrero');
              break;
            case 3:
              label.push('Marzo');
              break;
            case 4:
              label.push('Abril');
              break;
            case 5:
              label.push('Mayo');
              break;
            case 6:
              label.push('Junio');
              break;
            case 7:
              label.push('Julio');
              break;
            case 8:
              label.push('Agosto');
              break;
            case 9:
              label.push('Septiembre');
              break;
            case 10:
              label.push('Octubre');
              break;
            case 11:
              label.push('Noviembre');
              break;
            case 12:
              label.push('Diciembre');
          }
        }

        // Configuraciones para gráficos de barra     
        const barOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 20,
                color: '#64748b'
              },
              grid: {
                color: '#e2e8f0'
              }
            },
            x: {
              type: 'category',
              grid: {
                display: false
              },
              ticks: {
                color: '#64748b',
                autoSkip: false   // Para mostrar todas las etiquetas       
              },
              offset: true,
              distribution: 'series'  // Distribuir uniformemente
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#334155',
                font: {
                  weight: '500'
                }
              }
            }
          }
        };

        // Gráfico principal     
        this.data = {
          labels: label,
          datasets: [
            {
              label: 'Dataset 1',
              data: label.map((_, i) => kgs[i] ?? null),
              borderColor: '#4f46e5', // Color indigo para Tailwind           
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y'
            },
            {
              label: 'Dataset 2',
              data: kgs,
              borderColor: '#10b981', // Color emerald para Tailwind           
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y1'
            }
          ]
        };

        this.options = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              ticks: {
                stepSize: 10,
                color: '#64748b'
              },
              grid: {
                drawOnChartArea: true,
                color: '#e2e8f0'
              },
              beginAtZero: true,  // Asegura que el eje Y comience en 0
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              ticks: {
                stepSize: 10,
                color: '#64748b'
              },
              grid: {
                drawOnChartArea: false
              },
              beginAtZero: true,  // Asegura que el eje Y secundario también comience en 0
            },
            x: {
              type: 'category',
              grid: {
                display: false
              },
              ticks: {
                color: '#64748b',
                autoSkip: false,          // Asegurar que se muestren todas las etiquetas
                maxRotation: 0            // Evitar rotación de etiquetas
              },
              offset: true,               // Mejor distribución de puntos
              distribution: 'series',     // Distribución uniforme de etiquetas
              bounds: 'ticks'             // Asegurar que el rango completo se muestre
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#334155'         // Color de las etiquetas en la leyenda
              }
            },
            tooltip: {
              enabled: true,  // Habilitar tooltips
              mode: 'nearest', // Mostrar tooltip sobre el punto más cercano
              intersect: false, // Para mostrar tooltips cuando el cursor esté sobre cualquier punto
              callbacks: {

                // Personalización de las etiquetas del tooltip
                label: function (tooltipItem: any) {
                  // tooltipItem tiene acceso a todos los datos del punto seleccionado

                  let dataValue = tooltipItem.raw;  // Valor del punto
                  // Accede al índice del punto de datos seleccionado
                  let index = tooltipItem.dataIndex;

                  // Accede al cliente correspondiente usando el índice
                  let cliente = clientes[index];  // Asumiendo que 'clientes' es un array con los nombres de los clientes



                  // Crear un mensaje personalizado con los datos
                  return `Semana: ${cliente} - Kilos: ${dataValue}`;
                }
              }
            },
            layout: {
              padding: {
                left: 10,
                right: 10
              }
            }
          }
        };
        break;
      case 'semana':
        this.vistaSeleccionada = 'semana';
        const s = new Date();

        let primerDia = new Date(s.getFullYear(), s.getMonth(), 1);
        let ultimoDia = new Date(s.getFullYear(), s.getMonth() + 1, 0);
        let label2: number[] = [];
        let semanas: string[] = []//Para guardar las semanas

        for (let i = primerDia.getDate(); i <= ultimoDia.getDate(); i++) {
          let dia = new Date(s.getFullYear(), s.getMonth(), i);
          if (dia.getDay() == 0) {
            const primerDiaAno = new Date(primerDia.getFullYear(), 0, 1);
            const diaSemana1EneroGrande = primerDiaAno.getDay();
            let semana = Math.floor((dia.getTime() - primerDiaAno.getTime()) / (1000 * 60 * 60 * 24));
            semana = Math.ceil((semana + diaSemana1EneroGrande) / 7);
            label2.push(semana);

          }
          if (i == ultimoDia.getDate() && dia.getDay() != 0) {
            const primerDiaAno = new Date(primerDia.getFullYear(), 0, 1);
            const diaSemana1EneroGrande = primerDiaAno.getDay();
            let semana = Math.floor((dia.getTime() - primerDiaAno.getTime()) / (1000 * 60 * 60 * 24));
            semana = Math.ceil((semana + diaSemana1EneroGrande) / 7);
            label2.push(semana);
          }
        }

        let kgs2: number[] = new Array(label2.length).fill(0);
        let clientes2: string[] = new Array(label2.length);
        let repetidos2: { mes: number, cliente: string }[] = [];
        for (let i = 0; i < planningDetails.length; i++) {//para ir sumando los kg de cada semana
          let dia = new Date(planningDetails[i].fechaDesde);
          //Necesitamos saber en que semana entra la planificación de la necesidad
          const primerDiaAno = new Date(dia.getFullYear(), 0, 1);
          const diaSemana1EneroGrande = primerDiaAno.getDay();
          let semana = Math.floor((dia.getTime() - primerDiaAno.getTime()) / (1000 * 60 * 60 * 24));
          semana = Math.ceil((semana + diaSemana1EneroGrande) / 7);


          for (let j = 0; j < label2.length; j++) {
            if (semana == label2[j]) {
              //Saber los clientes que estan en la semana de la necesidad
              const id = this.planning.find(item => item.id == planningDetails[i].idCommercialNeedsPlanning);
              const client = this.comNeeds.find(item => item.id == id?.idCommercialNeed)
              if (!repetidos2.find(item => item.mes == j && item.cliente == client?.clientName)) {
                clientes2[j] = (clientes2[j] || '') + client?.clientName + '-';
                repetidos2.push({ mes: j, cliente: client?.clientName ?? '' })
              }
              kgs2[j] = (kgs2[j] || 0) + planningDetails[i].kilos;//Si los kilos estan vacios lo ponemos a 0.

            }
          }
        }

        for (let i = 0; i < label2.length; i++) {
          semanas.push('Semana ' + (i + 1));

        }
        // Configuraciones para gráficos de barra     
        const barOptions2 = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 20,
                color: '#64748b'
              },
              grid: {
                color: '#e2e8f0'
              }
            },
            x: {
              type: 'category',
              grid: {
                display: false
              },
              ticks: {
                color: '#64748b',
                autoSkip: false   // Para mostrar todas las etiquetas       
              },
              offset: true,
              distribution: 'series'  // Distribuir uniformemente
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#334155',
                font: {
                  weight: '500'
                }
              }
            }
          }
        };

        // Gráfico principal     
        this.data = {
          labels: semanas,
          datasets: [
            {
              label: 'Dataset 1',
              data: semanas.map((_, i) => kgs2[i] ?? null),
              borderColor: '#4f46e5', // Color indigo para Tailwind           
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y'
            },
            {
              label: 'Dataset 2',
              data: kgs2,
              borderColor: '#10b981', // Color emerald para Tailwind           
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y1'
            }
          ]
        };

        this.options = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              ticks: {
                stepSize: 10,
                color: '#64748b'
              },
              grid: {
                drawOnChartArea: true,
                color: '#e2e8f0'
              },
              beginAtZero: true,  // Asegura que el eje Y comience en 0
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              ticks: {
                stepSize: 10,
                color: '#64748b'
              },
              grid: {
                drawOnChartArea: false
              },
              beginAtZero: true,  // Asegura que el eje Y secundario también comience en 0
            },
            x: {
              type: 'category',
              grid: {
                display: false
              },
              ticks: {
                color: '#64748b',
                autoSkip: false,          // Asegurar que se muestren todas las etiquetas
                maxRotation: 0            // Evitar rotación de etiquetas
              },
              offset: true,               // Mejor distribución de puntos
              distribution: 'series',     // Distribución uniforme de etiquetas
              bounds: 'ticks'             // Asegurar que el rango completo se muestre
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#334155'         // Color de las etiquetas en la leyenda
              }
            },
            tooltip: {
              enabled: true,  // Habilitar tooltips
              mode: 'nearest', // Mostrar tooltip sobre el punto más cercano
              intersect: false, // Para mostrar tooltips cuando el cursor esté sobre cualquier punto
              callbacks: {

                // Personalización de las etiquetas del tooltip
                label: function (tooltipItem: any) {
                  // tooltipItem tiene acceso a todos los datos del punto seleccionado

                  let dataValue = tooltipItem.raw;  // Valor del punto
                  // Accede al índice del punto de datos seleccionado
                  let index = tooltipItem.dataIndex;

                  // Accede al cliente correspondiente usando el índice
                  let cliente = clientes2[index];  // Asumiendo que 'clientes' es un array con los nombres de los clientes



                  // Crear un mensaje personalizado con los datos
                  return `Semana: ${cliente} - Kilos: ${dataValue}`;
                }
              }
            },
            layout: {
              padding: {
                left: 10,
                right: 10
              }
            }
          }
        };

        break;
      case 'año':
        this.vistaSeleccionada = 'año';
        let meses2: number[] = [9,10,11,12,1,2,3,4,5,6,7,8];
        

        let kgs3: number[] = new Array(meses2.length).fill(0);
        let clientes3: string[] = new Array(meses2.length);
        let repetidos3: { mes: number, cliente: string }[] = [];
        for (let i = 0; i < planningDetails.length; i++) {//para ir sumando los kg de cada semana

          //Necesitamos saber en que mes entra la planificación de la necesidad
          const mes = new Date(planningDetails[i].fechaDesde);


          for (let j = 0; j < meses2.length; j++) {
            if (mes.getMonth() + 1 == meses2[j]) {
              //Saber los clientes que estan en la semana de la necesidad
              const id = this.planning.find(item => item.id == planningDetails[i].idCommercialNeedsPlanning);
              const client = this.comNeeds.find(item => item.id == id?.idCommercialNeed)
              if (!repetidos3.find(item => item.mes == j && item.cliente == client?.clientName)) {
                clientes3[j] = (clientes3[j] || '') + client?.clientName + '-';
                repetidos3.push({ mes: j, cliente: client?.clientName ?? '' })
              }
              kgs3[j] = (kgs3[j] || 0) + planningDetails[i].kilos;//Si los kilos estan vacios lo ponemos a 0.

            }
          }

        }
        let label3: string[] = [];
        for (let i = 0; i < meses2.length; i++) {
          switch (meses2[i]) {
            case 1:
              label3.push('Enero');
              break;
            case 2:
              label3.push('Febrero');
              break;
            case 3:
              label3.push('Marzo');
              break;
            case 4:
              label3.push('Abril');
              break;
            case 5:
              label3.push('Mayo');
              break;
            case 6:
              label3.push('Junio');
              break;
            case 7:
              label3.push('Julio');
              break;
            case 8:
              label3.push('Agosto');
              break;
            case 9:
              label3.push('Septiembre');
              break;
            case 10:
              label3.push('Octubre');
              break;
            case 11:
              label3.push('Noviembre');
              break;
            case 12:
              label3.push('Diciembre');
          }
        }
         // Gráfico principal     
         this.data = {
          labels: label3,
          datasets: [
            {
              label: 'Dataset 1',
              data: meses2.map((_, i) => kgs3[i] ?? null),
              borderColor: '#4f46e5', // Color indigo para Tailwind           
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y'
            },
            {
              label: 'Dataset 2',
              data: kgs3,
              borderColor: '#10b981', // Color emerald para Tailwind           
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y1'
            }
          ]
        };

        this.options = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              ticks: {
                stepSize: 10,
                color: '#64748b'
              },
              grid: {
                drawOnChartArea: true,
                color: '#e2e8f0'
              },
              beginAtZero: true,  // Asegura que el eje Y comience en 0
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              ticks: {
                stepSize: 10,
                color: '#64748b'
              },
              grid: {
                drawOnChartArea: false
              },
              beginAtZero: true,  // Asegura que el eje Y secundario también comience en 0
            },
            x: {
              type: 'category',
              grid: {
                display: false
              },
              ticks: {
                color: '#64748b',
                autoSkip: false,          // Asegurar que se muestren todas las etiquetas
                maxRotation: 0            // Evitar rotación de etiquetas
              },
              offset: true,               // Mejor distribución de puntos
              distribution: 'series',     // Distribución uniforme de etiquetas
              bounds: 'ticks'             // Asegurar que el rango completo se muestre
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#334155'         // Color de las etiquetas en la leyenda
              }
            },
            tooltip: {
              enabled: true,  // Habilitar tooltips
              mode: 'nearest', // Mostrar tooltip sobre el punto más cercano
              intersect: false, // Para mostrar tooltips cuando el cursor esté sobre cualquier punto
              callbacks: {

                // Personalización de las etiquetas del tooltip
                label: function (tooltipItem: any) {
                  // tooltipItem tiene acceso a todos los datos del punto seleccionado

                  let dataValue = tooltipItem.raw;  // Valor del punto
                  // Accede al índice del punto de datos seleccionado
                  let index = tooltipItem.dataIndex;

                  // Accede al cliente correspondiente usando el índice
                  let cliente = clientes3[index];  // Asumiendo que 'clientes' es un array con los nombres de los clientes



                  // Crear un mensaje personalizado con los datos
                  return `Semana: ${cliente} - Kilos: ${dataValue}`;
                }
              }
            },
            layout: {
              padding: {
                left: 10,
                right: 10
              }
            }
          }
        };
    }
  }
}