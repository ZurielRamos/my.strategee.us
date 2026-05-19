import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-page-title',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.scss'],
})
export class PageTitleComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showControls: boolean = false;
  @Input() date?: string;
  @Input() filterLabel?: string = 'Today';
}
