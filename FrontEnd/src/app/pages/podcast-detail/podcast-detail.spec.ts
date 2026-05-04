import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodcastDetail } from './podcast-detail';

describe('PodcastDetail', () => {
  let component: PodcastDetail;
  let fixture: ComponentFixture<PodcastDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodcastDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodcastDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
