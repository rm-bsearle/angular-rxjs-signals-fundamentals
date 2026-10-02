import { computed, effect, Injectable, signal } from "@angular/core";
import { CartItem } from "./cart";
import { Product } from "../products/product";

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<CartItem[]>([]);

  cartCount = computed(() => this.cartItems()
    .reduce((accQty, item) => accQty + item.quantity, 0)
  );

  subTotal = computed(() => this.cartItems()
    .reduce((accTotal, item) => accTotal + (item.product.price * item.quantity),0)
  );

  deliveryFee = computed<number>(() => this.subTotal() < 50 ? 5.99 : 0)

  tax = computed(() => Math.round(this.subTotal() * 10.75) / 100);

  totalPrice = computed(() => this.deliveryFee() + this.subTotal() + this.tax());

  eLength = effect(() => {console.log('Cart array length:', this.cartItems().length)})

  addToCart(product: Product) {
    this.cartItems.update(items => [...items, {product, quantity: 1}])
  }
}
