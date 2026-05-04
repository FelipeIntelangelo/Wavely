import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPodcasts } from './my-podcasts';

describe('MyPodcasts', () => {
  let component: MyPodcasts;
  let fixture: ComponentFixture<MyPodcasts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPodcasts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPodcasts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
