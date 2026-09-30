import { Injectable, signal } from "@angular/core";
import { CartItem } from "./cart";

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<CartItem[]>([]);
}
