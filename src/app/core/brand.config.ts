export interface BrandConfig {
  /** Identificador del negocio; luego vendrá dinámico del SaaS Master (ej. por subdominio). */
  tenantCode: string;
  name: string;
  tagline: string;
  /** Reemplaza public/logo-perfumeria.svg por tu logo real o una URL del bucket. */
  logoUrl: string;
  currency: string;
}

export const BRAND_CONFIG: BrandConfig = {
  tenantCode: 'perfumeria-demo',
  name: 'Aroma Atelier',
  tagline: 'Haute Parfumerie',
  logoUrl: '/logo-perfumeria.svg',
  currency: 'S/. ',
};
