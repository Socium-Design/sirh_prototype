import { NAV_ROUTES, navItemFromUrl, productFromUrl, routeForNavItem, routeForProduct } from './navigation.map';

describe('navigation.map', () => {
  it('maps URL segments to design-system products (perf → perfs)', () => {
    expect(productFromUrl('/workspace/employes')).toBe('workspace');
    expect(productFromUrl('/perf/formation')).toBe('perfs');
    expect(productFromUrl('/job')).toBe('job');
    expect(productFromUrl('/')).toBe('workspace');
  });

  it('derives the active product from a coming-soon URL', () => {
    expect(productFromUrl('/a-venir/payroll-accueil')).toBe('payroll');
    expect(productFromUrl('/a-venir/workspace-structures')).toBe('workspace');
  });

  it('finds the menu item of a page, ignoring query string and trailing slash', () => {
    expect(navItemFromUrl('/workspace/employes')).toBe('workspace-employes');
    expect(navItemFromUrl('/workspace/employes/?q=a#top')).toBe('workspace-employes');
    expect(navItemFromUrl('/perf/evaluation')).toBe('perfs-evaluations');
    expect(navItemFromUrl('/workspace/carrieres')).toBeUndefined();
  });

  it('highlights the item of a coming-soon page', () => {
    expect(navItemFromUrl('/a-venir/workspace-structures')).toBe('workspace-structures');
  });

  it('opens a built page for a mapped item and the coming-soon page otherwise', () => {
    expect(routeForNavItem('workspace-employes')).toBe('/workspace/employes');
    expect(routeForNavItem('workspace-structures')).toBe('/a-venir/workspace-structures');
  });

  it('opens a built product home, or the coming-soon accueil of an unbuilt product', () => {
    expect(routeForProduct('perfs')).toBe('/perf');
    expect(routeForProduct('payroll')).toBe('/a-venir/payroll-accueil');
  });

  it('every mapped route points to a known product', () => {
    for (const route of Object.values(NAV_ROUTES)) expect(productFromUrl(route)).toBeDefined();
  });
});
