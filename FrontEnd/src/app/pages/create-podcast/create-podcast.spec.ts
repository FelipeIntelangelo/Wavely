import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePodcastComponent } from './create-podcast';

describe('CreatePodcastComponent', () => {
  let component: CreatePodcastComponent;
  let fixture: ComponentFixture<CreatePodcastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePodcastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePodcastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
