import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Product, Result } from './product';
import { HttpErrorService } from '../utilities/http-error.service';
import { Review } from '../reviews/review';
import { ReviewService } from '../reviews/review.service';
import { toSignal } from '@angular/core/rxjs-interop'


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  private reviewService = inject(ReviewService);

  private productsResult$ = this.http.get<Product[]>(this.productsUrl)
      .pipe(
        map(p => ({data: p} as Result<Product[]>)),
        tap(p => console.log(JSON.stringify(p))),
        shareReplay(1),
        catchError(err =>of({
          data: [],
          error: this.errorService.formatError(err)
        } as Result<Product[]>)),
      );
  private productsResult = toSignal(this.productsResult$,
    { initialValue: ({ data: [] } as Result<Product[]>) });

  products = computed(() => this.productsResult().data)
  productsError = computed(() => this.productsResult().error)

  private readonly productSelectedSubject = new BehaviorSubject<number | undefined>(undefined);
  readonly productSelected$ = this.productSelectedSubject.asObservable();
  selectedProductId = signal<number | undefined>(undefined);

  readonly product$ = this.productSelected$.pipe(
    filter(Boolean),
    switchMap(id => {
      const productUrl = `${this.productsUrl}/${id}`;
      return this.http.get<Product>(productUrl)
        .pipe(
          switchMap(product => this.getProductWithReviews(product)),
          catchError(err => this.handleError(err)),
        )
    }),
  );

  // readonly product$ = combineLatest([
  //   this.productSelected$,
  //   this.products$
  // ]).pipe(
  //     map(([selectedProductId, products]) => products.find(product => product.id === selectedProductId)),
  //     filter(Boolean),
  //     switchMap(product => this.getProductWithReviews(product)),
  //     catchError(err => this.handleError(err)),
  //   );

  getProductWithReviews(product: Product): Observable<Product> {
    if(product.hasReviews) {
      return this.http.get<Review[]>(this.reviewService.getReviewUrl(product.id))
        .pipe(
          map(reviews => ({...product, reviews} as Product))
        );
    } else {
      return of(product);
    }
  }

  productSelected(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
    this.selectedProductId.set(selectedProductId);
  }

  handleError(err: HttpErrorResponse): Observable<never> {
    const formattedMessage = this.errorService.formatError(err);
    // can simply throw, in this context it will also create a replacement observable that when subscribed emits an error notification
    // throw formattedMessage;
    return throwError(() => new Error(formattedMessage));
  }
}
