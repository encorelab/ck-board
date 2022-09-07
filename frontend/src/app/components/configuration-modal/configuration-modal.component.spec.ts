import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationModalComponent } from './configuration-modal.component';

describe('ConfigurationModalComponent', () => {
  let component: ConfigurationModalComponent;
  let fixture: ComponentFixture<ConfigurationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigurationModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigurationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
