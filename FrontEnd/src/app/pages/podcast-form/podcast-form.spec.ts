import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodcastForm } from './podcast-form';

describe('PodcastForm', () => {
  let component: PodcastForm;
  let fixture: ComponentFixture<PodcastForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodcastForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodcastForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
