import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { StoreLayout } from './layouts/store-layout/store-layout';
import { AuthService } from './services/auth.service';

describe('App & Storefront/Admin separation', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App, StoreLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render perfumeria brand in public store layout', async () => {
    const fixture = TestBed.createComponent(StoreLayout);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('Aroma Atelier');
  });

  it('should authenticate demo admin with valid credentials', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.login('admin@perfumeria.com', 'wrong', 'perfumeria-demo')).toBe(false);
    expect(auth.login('admin@perfumeria.com', 'Demo2026!', 'perfumeria-demo')).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
  });
});
