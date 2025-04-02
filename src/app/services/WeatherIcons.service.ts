import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class WeatherIconsService {
  private icons: { [key: string]: string } = {
    sunny: `<svg fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16,8c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S20.4,8,16,8z"/>
      <path d="M16,7c0.6,0,1-0.4,1-1V3c0-0.6-0.4-1-1-1s-1,0.4-1,1v3C15,6.6,15.4,7,16,7z"/>
      <path d="M8.2,9.6c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L7.5,6.1c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4L8.2,9.6z"/>
      <path d="M7,16c0-0.6-0.4-1-1-1H3c-0.6,0-1,0.4-1,1s0.4,1,1,1h3C6.6,17,7,16.6,7,16z"/>
      <path d="M8.2,22.4l-2.1,2.1c-0.4,0.4-0.4,1,0,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l2.1-2.1c0.4-0.4,0.4-1,0-1.4S8.6,22,8.2,22.4z"/>
      <path d="M16,25c-0.6,0-1,0.4-1,1v3c0,0.6,0.4,1,1,1s1-0.4,1-1v-3C17,25.4,16.6,25,16,25z"/>
      <path d="M23.8,22.4c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l2.1,2.1c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L23.8,22.4z"/>
      <path d="M29,15h-3c-0.6,0-1,0.4-1,1s0.4,1,1,1h3c0.6,0,1-0.4,1-1S29.6,15,29,15z"/>
      <path d="M23.1,9.9c0.3,0,0.5-0.1,0.7-0.3l2.1-2.1c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-2.1,2.1c-0.4,0.4-0.4,1,0,1.4C22.6,9.8,22.8,9.9,23.1,9.9z"/>
    </svg>`,

    // Añade todos los demás SVG aquí con sus claves correspondientes
    storm: `<svg fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M13,30c-0.2,0-0.4-0.1-0.6-0.2c-0.5-0.3-0.6-0.9-0.3-1.4l3-4.4H13c-0.4,0-0.7-0.2-0.9-0.5s-0.2-0.7,0-1l4-6c0.3-0.5,0.9-0.6,1.4-0.3c0.5,0.3,0.6,0.9,0.3,1.4l-3,4.4H17c0.4,0,0.7,0.2,0.9,0.5s0.2,0.7,0,1l-4,6C13.6,29.8,13.3,30,13,30z"/>
      <path d="M19,4c-4.4,0-8.2,2.8-9.5,7C5.9,11,3,13.9,3,17.5C3,21.1,5.9,24,9.5,24l0.7,0c-0.3-0.9-0.2-1.9,0.3-2.7l4-6c0.4-0.7,1.1-1.1,1.9-1.3c0.8-0.2,1.6,0,2.3,0.4c0.7,0.4,1.1,1.1,1.3,1.9c0.2,0.8,0,1.6-0.4,2.3l-1.1,1.7c0.5,0.3,1,0.7,1.3,1.2c0.4,0.7,0.4,1.5,0.2,2.2l1,0c0.1,0,0.1,0,0.2,0c4.6-1,8-5.1,8-9.8C29,8.5,24.5,4,19,4z"/>
    </svg>`,

    partially_cloudy: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <!-- Sol (amarillo) -->
        <g>
            <path fill="orange" d="M4,14H2c-0.6,0-1-0.4-1-1s0.4-1,1-1h2c0.6,0,1,0.4,1,1S4.6,14,4,14z"/>
            <path fill="orange" d="M19.4,7.6c-0.3,0-0.5-0.1-0.7-0.3c-0.4-0.4-0.4-1,0-1.4l1.4-1.4c0.4-0.4,1-0.4,1.4,0s0.4,1,0,1.4l-1.4,1.4C19.9,7.5,19.6,7.6,19.4,7.6z"/>
            <path fill="orange" d="M13,5c-0.6,0-1-0.4-1-1V2c0-0.6,0.4-1,1-1s1,0.4,1,1v2C14,4.6,13.6,5,13,5z"/>
            <path fill="orange" d="M6.6,7.6c-0.3,0-0.5-0.1-0.7-0.3L4.5,5.9c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0l1.4,1.4c0.4,0.4,0.4,1,0,1.4C7.1,7.5,6.9,7.6,6.6,7.6z"/>
        </g>
        <!-- Nube (gris) -->
        <g>
            <path fill="gray" d="M21.1,30h-8.3C9.6,30,7,27.4,7,24.1c0-3.2,2.5-5.8,5.7-5.9c1.2-3.7,4.5-6.2,8.4-6.2c4.9,0,8.9,4,8.9,9S26,30,21.1,30z"/>
            <path fill="orange" d="M11.3,16.4c1.5-3.3,4.6-5.7,8.1-6.2C18.3,7.7,15.8,6,13,6c-3.9,0-7,3.1-7,7c0,1.9,0.8,3.6,2,4.9C9,17.2,10.1,16.6,11.3,16.4z"/>
        </g>
    </svg>`,

    cloudy: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <!-- Nube (gris) -->
    <g>
        <path fill="gray" d="M22.4,29H16c-2.8,0-5-2.2-5-5c0-2.5,1.8-4.5,4.2-4.9c1-3,3.9-5.1,7.2-5.1c4.2,0,7.6,3.4,7.6,7.5S26.6,29,22.4,29z"/>
        <path fill="gray" d="M13.8,17.4c1.6-3.3,4.9-5.4,8.7-5.4c2.1,0,4,0.7,5.5,1.8c0-0.3,0.1-0.5,0.1-0.8c0-5.5-4.5-10-10-10c-4.4,0-8.2,2.8-9.5,7C4.9,10,2,12.9,2,16.5C2,20.1,4.9,23,8.5,23h0.6C9.5,20.4,11.3,18.3,13.8,17.4z"/>
    </g>
</svg>`,

    rainy: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <!-- Sol (amarillo) -->
        <g fill="#ADD8E6">
            <path d="M15,30c-0.6,0-1-0.4-1-1v-6c0-0.6,0.4-1,1-1s1,0.4,1,1v6C16,29.6,15.6,30,15,30z"/>
            <path d="M11,28c-0.6,0-1-0.4-1-1v-6c0-0.6,0.4-1,1-1s1,0.4,1,1v6C12,27.6,11.6,28,11,28z"/>
            <path d="M19,28c-0.6,0-1-0.4-1-1v-6c0-0.6,0.4-1,1-1s1,0.4,1,1v6C20,27.6,19.6,28,19,28z"/>
        </g>
        <!-- Nube (gris) -->
        <path fill="gray" d="M19,4c-4.4,0-8.2,2.8-9.5,7C5.9,11,3,13.9,3,17.5c0,3.1,2.1,5.6,5,6.3V21c0-1.7,1.3-3,3-3c1.4,0,2.5,0.9,2.9,2.2
        c0.3-0.1,0.7-0.2,1.1-0.2c0.4,0,0.8,0.1,1.1,0.2c0.3-1.3,1.5-2.2,2.9-2.2c1.7,0,3,1.3,3,3v2.5c4.1-1.3,7-5.1,7-9.5
        C29,8.5,24.5,4,19,4z"/>
    </svg>`,

    fog: `<svg fill="gray" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" stroke="gray" class="weather-icon">
    <g id="SVGRepo_iconCarrier">
        <g> 
            <path d="M19,5c-4.4,0-8.2,2.8-9.5,7c-3.3,0-6.1,2.6-6.4,5.9c0,0.3,0.1,0.6,0.3,0.8S3.7,19,4,19h23.5c0.4,0,0.8-0.3,0.9-0.7 c0.4-1.1,0.6-2.2,0.6-3.3C29,9.5,24.5,5,19,5z"></path> 
            <path d="M19,22c0-0.6-0.4-1-1-1H4c-0.6,0-1,0.4-1,1s0.4,1,1,1h14C18.6,23,19,22.6,19,22z"></path> 
            <path d="M27,21h-5c-0.6,0-1,1-1,1s0.4,1,1,1h5c0.6,0,1-0.4,1-1S27.6,21,27,21z"></path> 
            <path d="M22,25H8c-0.6,0-1,1-1,1s0.4,1,1,1h14c0.6,0,1-0.4,1-1S22.6,25,22,25z"></path> 
        </g> 
    </g>
</svg>`,

    rain: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <!-- Gotas de lluvia (azul) -->
        <g>
            <path fill="#4682B4" d="M9,28c-0.1,0-0.3,0-0.4-0.1c-0.5-0.2-0.7-0.8-0.5-1.3l3-7c0.2-0.5,0.8-0.7,1.3-0.5c0.5,0.2,0.7,0.8,0.5,1.3l-3,7 C9.8,27.8,9.4,28,9,28z"></path>
        </g>
        <g>
            <path fill="#4682B4" d="M12,30c-0.1,0-0.3,0-0.4-0.1c-0.5-0.2-0.7-0.8-0.5-1.3l3-7c0.2-0.5,0.8-0.7,1.3-0.5c0.5,0.2,0.7,0.8,0.5,1.3l-3,7 C12.8,29.8,12.4,30,12,30z"></path>
        </g>
        <g>
            <path fill="#4682B4" d="M17,28c-0.1,0-0.3,0-0.4-0.1c-0.5-0.2-0.7-0.8-0.5-1.3l3-7c0.2-0.5,0.8-0.7,1.3-0.5c0.5,0.2,0.7,0.8,0.5,1.3l-3,7 C17.8,27.8,17.4,28,17,28z"></path>
        </g>
        <!-- Nube (gris) -->
        <path fill="gray" d="M19,4c-4.4,0-8.2,2.8-9.5,7C5.9,11,3,13.9,3,17.5c0,2.4,1.3,4.6,3.4,5.7c0.3,0.1,0.5,0.3,0.8,0.4l2-4.8 c0.3-0.7,0.9-1.3,1.6-1.6c0.7-0.3,1.6-0.3,2.3,0c0.7,0.3,1.3,0.9,1.6,1.6c0,0,0,0.1,0,0.1c0.5,0,0.9,0,1.4,0.2 c0.3,0.1,0.5,0.3,0.7,0.4l0.4-0.9c0.3-0.7,0.9-1.3,1.6-1.6c0.7-0.3,1.6-0.3,2.3,0c0.7,0.3,1.3,0.9,1.6,1.6c0.3,0.7,0.3,1.6,0,2.3 l-1,2.4c4.2-1.2,7.3-5,7.3-9.6C29,8.5,24.5,4,19,4z"></path>
    </svg>`,

    havy_rain:`<svg fill="gray" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" stroke="gray"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M16,30c-2.8,0-5-2.2-5-5c0-2.4,3.5-7.6,4.2-8.6c0.4-0.5,1.3-0.5,1.6,0c0.7,1,4.2,6.2,4.2,8.6C21,27.8,18.8,30,16,30z"></path> </g> <path d="M19,3c-4.4,0-8.2,2.8-9.5,7C5.9,10,3,12.9,3,16.5c0,2.4,1.3,4.6,3.4,5.7c0.9,0.5,1.9,0.8,3,0.8c0.8-2.6,2.8-5.8,4.2-7.7 C14.1,14.5,15,14,16,14s1.9,0.5,2.5,1.3c1.2,1.8,3,4.6,4,7.1C26.3,21,29,17.3,29,13C29,7.5,24.5,3,19,3z"></path> </g></svg>`,
    light_snow:`<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" fill="gray" stroke="gray"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;} .st1{fill:none;stroke:#000000;stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;} </style> <path class="st0" d="M25.3,19.43C26.97,17.8,28,15.52,28,13c0-4.97-4.03-9-9-9c-4.28,0-7.86,2.99-8.77,7H9.5C6.48,11,4,13.47,4,16.5 c0,1.75,0.82,3.31,2.1,4.32"></path> <line class="st0" x1="16" y1="17.79" x2="16" y2="22.04"></line> <polyline class="st0" points="17.7,16.09 16,17.79 14.3,16.09 "></polyline> <line class="st0" x1="12.32" y1="19.91" x2="16" y2="22.04"></line> <polyline class="st0" points="11.7,17.59 12.32,19.91 10,20.53 "></polyline> <line class="st0" x1="12.32" y1="24.16" x2="16" y2="22.04"></line> <polyline class="st0" points="10,23.54 12.32,24.16 11.7,26.48 "></polyline> <line class="st0" x1="16" y1="26.28" x2="16" y2="22.04"></line> <polyline class="st0" points="14.3,27.98 16,26.28 17.7,27.98 "></polyline> <line class="st0" x1="19.68" y1="24.16" x2="16" y2="22.04"></line> <polyline class="st0" points="20.3,26.48 19.68,24.16 22,23.54 "></polyline> <line class="st0" x1="19.68" y1="19.91" x2="16" y2="22.04"></line> <polyline class="st0" points="22,20.53 19.68,19.91 20.3,17.59 "></polyline> </g></svg>`,
    snow:`<svg fill="#00bfff" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" stroke="#00bfff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M16.9,15.8l-0.5-2l2-0.5c0.5-0.1,0.9-0.7,0.7-1.2c-0.1-0.5-0.7-0.9-1.2-0.7l-2.5,0.7l-2.8-1.6l2.8-1.6l2.5,0.7 c0.1,0,0.2,0,0.3,0c0.4,0,0.8-0.3,1-0.7c0.1-0.5-0.2-1.1-0.7-1.2l-2-0.5l0.5-2c0.1-0.5-0.2-1.1-0.7-1.2c-0.5-0.1-1.1,0.2-1.2,0.7 l-0.7,2.5l-2.8,1.6V5.6l1.9-1.9c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-1.4,1.4L9.1,2.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l1.9,1.9v3.2 L6.7,7.2L6,4.6C5.9,4.1,5.4,3.8,4.8,3.9C4.3,4.1,4,4.6,4.1,5.2l0.5,2l-2,0.5C2.1,7.8,1.8,8.3,2,8.9c0.1,0.4,0.5,0.7,1,0.7 c0.1,0,0.2,0,0.3,0l2.5-0.7l2.8,1.6l-2.8,1.6l-2.5-0.7c-0.5-0.1-1.1,0.2-1.2,0.7s0.2,1.1,0.7,1.2l2,0.5l-0.5,2 c-0.1,0.5,0.2,1.1,0.7,1.2c0.1,0,0.2,0,0.3,0c0.4,0,0.8-0.3,1-0.7l0.7-2.5l2.8-1.6v3.2l-1.9,1.9c-0.4,0.4-0.4,1,0,1.4s1,0.4,1.4,0 l1.4-1.4l1.4,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4l-1.9-1.9v-3.2l2.8,1.6l0.7,2.5 c0.1,0.4,0.5,0.7,1,0.7c0.1,0,0.2,0,0.3,0C16.7,16.9,17,16.4,16.9,15.8z"></path> <path d="M28.7,23.6l-1.9,0.5L25,23l1.8-1.1l1.9,0.5c0.1,0,0.2,0,0.3,0c0.4,0,0.8-0.3,1-0.7c0.1-0.5-0.2-1.1-0.7-1.2l-1.4-0.4 l0.4-1.4c0.1-0.5-0.2-1.1-0.7-1.2c-0.5-0.1-1.1,0.2-1.2,0.7l-0.5,1.9L24,21.3v-2.1l1.4-1.4c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-1,1 l-1-1c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l1.4,1.4v2.1l-1.8-1.1l-0.5-1.9c-0.1-0.5-0.7-0.9-1.2-0.7c-0.5,0.1-0.9,0.7-0.7,1.2 l0.4,1.4l-1.4,0.4c-0.5,0.1-0.9,0.7-0.7,1.2c0.1,0.4,0.5,0.7,1,0.7c0.1,0,0.2,0,0.3,0l1.9-0.5L21,23l-1.8,1.1l-1.9-0.5 c-0.5-0.1-1.1,0.2-1.2,0.7c-0.1,0.5,0.2,1.1,0.7,1.2l1.4,0.4l-0.4,1.4c-0.1,0.5,0.2,1.1,0.7,1.2c0.1,0,0.2,0,0.3,0 c0.4,0,0.8-0.3,1-0.7l0.5-1.9l1.8-1.1v2.1l-1.4,1.4c-0.4,0.4-0.4,1,0,1.4s1,0.4,1.4,0l1-1l1,1c0.2,0.2,0.5,0.3,0.7,0.3 s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L24,26.9v-2.1l1.8,1.1l0.5,1.9c0.1,0.4,0.5,0.7,1,0.7c0.1,0,0.2,0,0.3,0 c0.5-0.1,0.9-0.7,0.7-1.2l-0.4-1.4l1.4-0.4c0.5-0.1,0.9-0.7,0.7-1.2S29.3,23.4,28.7,23.6z"></path> </g> </g></svg>`,
    heavy_snow:`<svg fill="gray" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" stroke="gray"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21.7,22.6l-1.9,0.5L18,22l1.8-1.1l1.9,0.5c0.1,0,0.2,0,0.3,0c0.4,0,0.8-0.3,1-0.7c0.1-0.5-0.2-1.1-0.7-1.2l-1.4-0.4 l0.4-1.4c0.1-0.5-0.2-1.1-0.7-1.2c-0.5-0.1-1.1,0.2-1.2,0.7l-0.5,1.9L17,20.3v-2.1l1.4-1.4c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-1,1 l-1-1c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l1.4,1.4v2.1l-1.8-1.1l-0.5-1.9c-0.1-0.5-0.7-0.9-1.2-0.7c-0.5,0.1-0.9,0.7-0.7,1.2l0.4,1.4 l-1.4,0.4c-0.5,0.1-0.9,0.7-0.7,1.2c0.1,0.4,0.5,0.7,1,0.7c0.1,0,0.2,0,0.3,0l1.9-0.5L14,22l-1.8,1.1l-1.9-0.5 c-0.5-0.1-1.1,0.2-1.2,0.7c-0.1,0.5,0.2,1.1,0.7,1.2l1.4,0.4l-0.4,1.4c-0.1,0.5,0.2,1.1,0.7,1.2c0.1,0,0.2,0,0.3,0 c0.4,0,0.8-0.3,1-0.7l0.5-1.9l1.8-1.1v2.1l-1.4,1.4c-0.4,0.4-0.4,1,0,1.4s1,0.4,1.4,0l1-1l1,1c0.2,0.2,0.5,0.3,0.7,0.3 s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L17,25.9v-2.1l1.8,1.1l0.5,1.9c0.1,0.4,0.5,0.7,1,0.7c0.1,0,0.2,0,0.3,0 c0.5-0.1,0.9-0.7,0.7-1.2l-0.4-1.4l1.4-0.4c0.5-0.1,0.9-0.7,0.7-1.2C22.8,22.7,22.3,22.4,21.7,22.6z"></path> <path d="M19,3c-4.4,0-8.2,2.8-9.5,7C5.9,10,3,12.9,3,16.5c0,2.4,1.3,4.6,3.4,5.7c0.3,0.1,0.5,0.3,0.8,0.4c0.1-0.2,0.1-0.4,0.2-0.5 c-0.1-0.2-0.2-0.5-0.3-0.7C6.9,20.5,7,19.7,7.4,19c0.3-0.5,0.8-0.9,1.3-1.2c0-0.6,0.1-1.2,0.4-1.7c0.4-0.7,1-1.2,1.8-1.4 c0.3-0.1,0.5-0.1,0.8-0.1c0.1-0.2,0.3-0.4,0.5-0.6c1-1,2.7-1.2,3.8-0.4c1.2-0.8,2.8-0.7,3.8,0.4c0.2,0.2,0.3,0.4,0.5,0.6 c0.3,0,0.5,0,0.8,0.1c0.8,0.2,1.4,0.7,1.8,1.4c0.3,0.5,0.4,1.1,0.4,1.7c0.5,0.3,1,0.7,1.3,1.2c0.4,0.6,0.5,1.3,0.3,2 c2.5-1.8,4.1-4.7,4.1-8C29,7.5,24.5,3,19,3z"></path> </g></svg>`,
    hail:`<svg fill="gray" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" stroke="gray"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <circle cx="10" cy="24" r="2"></circle> <circle cx="16" cy="27" r="3"></circle> <circle cx="22" cy="24" r="2"></circle> <path d="M16,23c0.6,0,1-0.4,1-1v-5c0-0.6-0.4-1-1-1s-1,0.4-1,1v5C15,22.6,15.4,23,16,23z"></path> <path d="M11,14c-0.6,0-1,0.4-1,1v5c0,0.6,0.4,1,1,1s1-0.4,1-1v-5C12,14.4,11.6,14,11,14z"></path> <path d="M21,21c0.6,0,1-0.4,1-1v-5c0-0.6-0.4-1-1-1s-1,0.4-1,1v5C20,20.6,20.4,21,21,21z"></path> </g> <path d="M8,19.6V15c0-1.7,1.3-3,3-3c1.6,0,2.9,1.2,3,2.8c0.5-0.5,1.2-0.8,2-0.8s1.5,0.3,2,0.8c0.1-1.6,1.4-2.8,3-2.8 c1.7,0,3,1.3,3,3v3.4c2.5-1.7,4-4.4,4-7.4c0-5-4.1-9-9.3-9c-4.1,0-7.6,2.5-8.8,6.2c-3.3,0-6,2.7-6,5.9c0,2.2,1.2,4.1,3.2,5.2 C7.4,19.4,7.7,19.5,8,19.6z"></path> </g></svg>`,
    
  
  };


  

  constructor(private sanitizer: DomSanitizer) {}

  getIcon(iconName: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.icons[iconName] || '');
  }
}