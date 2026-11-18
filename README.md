# Carrito de Compras — Frontend (Angular 22 + TypeScript)

Aplicación web del carrito de compras conectada al backend Java (`http://localhost:8080/api`).

## Requisitos
- Node.js 22+ (`C:\laragon\bin\nodejs\node-v22.23.3-win-x64` si tu PATH apunta a Node 20)

## Cómo ejecutar
```powershell
npm install
npm start
```
Abre `http://localhost:4200`.

## Estructura
- `src/app/core/api.config.ts` — URL base del backend
- `src/app/models/` — Interfaces TypeScript (`Product`, `CartItem`, `Order`)
- `src/app/services/` — `ProductService`, `CartService` (Signals + `localStorage`), `OrderService`
- `src/app/pages/` — `product-list`, `cart`, `checkout`, `order-success`
