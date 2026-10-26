import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService', () => {
  const service = (search: string) => {
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { location: { search } } }] });
    return TestBed.inject(FeatureFlagsService);
  };

  it('« Confidentialité du potentiel » actif par défaut', () => {
    const flags = service('');
    expect(flags.actif('confidentialite-potentiel')).toBeTrue();
    expect(flags.libelle('confidentialite-potentiel')).toBe('Confidentialité du potentiel');
  });

  it('désactivable par l’URL : ?ff-confidentialite-potentiel=off', () => {
    expect(service('?ff-confidentialite-potentiel=off').actif('confidentialite-potentiel')).toBeFalse();
  });

  it('une autre valeur ne change rien', () => {
    expect(service('?ff-confidentialite-potentiel=peut-etre').actif('confidentialite-potentiel')).toBeTrue();
  });
});
