import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Product } from './product';
import { HttpErrorService } from '../utilities/http-error.service';
import { Review } from '../reviews/review';
import { ReviewService } from '../reviews/review.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  private reviewService = inject(ReviewService);

  readonly products$ = this.http.get<Product[]>(this.productsUrl)
      .pipe(
        tap(p => console.log(JSON.stringify(p))),
        shareReplay(1),
        catchError(err => this.handleError(err)),
      );

  private readonly productSelectedSubject = new BehaviorSubject<number | undefined>(undefined);
  readonly productSelected$ = this.productSelectedSubject.asObservable();

  getProduct(id: number): Observable<Product> {
    const productUrl = `${this.productsUrl}/${id}`;
    return this.http.get<Product>(productUrl)
      .pipe(
        tap(() => console.log('in http.get product pipeline')),
        switchMap(product => this.getProductWithReviews(product)),
        catchError(err => this.handleError(err)),
      )
  }

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
  }

  handleError(err: HttpErrorResponse): Observable<never> {
    const formattedMessage = this.errorService.formatError(err);
    // can simply throw, in this context it will also create a replacement observable that when subscribed emits an error notification
    // throw formattedMessage;
    return throwError(() => new Error(formattedMessage));
  }
}
