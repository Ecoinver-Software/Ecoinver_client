import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CultivoService } from "../services/Cultivo.service";
import { Cultive } from "../types/Cultive";

@Component({
  selector: "app-cultive-planning",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./cultive-planning.component.html",
})
export class CultivePlanningComponent implements OnInit {
  // Número seleccionado de partes (cards)
  numCards: number = 1;
  // Opciones para el select de número de partes
  numbers: number[] = [1, 2, 3, 4, 5];
  // Array para almacenar cada tarjeta con su valor de KG/Metro Cuadrado
  cards: { value: number | null }[] = [];
  // Lista de cultivos disponibles
  cultivos: string[] = ["Trigo", "Maíz", "Soja"];
  // Cultivos seleccionados (usado en el select múltiple)
  selectedCultivos: string[] = [];
  cultivo:Cultive[]=[];
  constructor(private cultivoSrvicio:CultivoService) {}

  ngOnInit(): void {

    this.cultivoSrvicio.getAll().subscribe(
      (data)=>{
        this.cultivo=data;
        console.log(this.cultivo);
      },
      (error)=>{
        console.error('Error '+error);
      }


    );
    this.updateCards();
  }

  // Actualiza el array de tarjetas según el número de partes seleccionado
  updateCards(): void {
    this.cards = [];
    for (let i = 0; i < this.numCards; i++) {
      this.cards.push({ value: null });
    }
  }
}
