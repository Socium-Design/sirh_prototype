import { TestBed } from '@angular/core/testing';
import { WidgetsMasquesService } from './widgets-masques.service';

describe('WidgetsMasquesService', () => {
  let service: WidgetsMasquesService;
  beforeEach(() => (service = TestBed.inject(WidgetsMasquesService)));

  it('ne masque rien par défaut', () => {
    expect(service.pour('tdb-1')).toEqual([]);
  });

  it('masque et réaffiche un widget, tableau par tableau', () => {
    service.basculer('tdb-1', 'w-1');
    service.basculer('tdb-1', 'w-2');
    service.basculer('tdb-3', 'w-9');
    service.basculer('tdb-1', 'w-1');
    expect(service.pour('tdb-1')).toEqual(['w-2']);
    expect(service.pour('tdb-3')).toEqual(['w-9']);
    service.toutAfficher('tdb-1');
    expect(service.pour('tdb-1')).toEqual([]);
  });
});
