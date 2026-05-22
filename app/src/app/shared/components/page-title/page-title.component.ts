import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';

@Component({
  selector: 'app-page-title',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.scss'],
})
export class PageTitleComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showControls: boolean = false;
  @Input() date?: string;
  @Input() filterLabel?: string = 'Today';

  constructor() {
    addIcons({ chevronDownOutline });
  }
}
