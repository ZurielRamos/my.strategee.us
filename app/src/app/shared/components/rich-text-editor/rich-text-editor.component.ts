import {
  Component,
  AfterViewInit,
  OnDestroy,
  Input,
  ElementRef,
  ViewChild,
  forwardRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';

@Component({
  selector: 'app-rich-text-editor',
  template: `<div class="rich-text-editor-wrapper"><div #editorContainer [style.min-height]="minHeight"></div></div>`,
  styleUrls: ['./rich-text-editor.component.scss'],
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLElement>;

  @Input() placeholder = 'Escribe aquí...';
  @Input() minHeight = '200px';

  private quill!: Quill;
  private value = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private initialized = false;

  ngAfterViewInit() {
    this.quill = new Quill(this.editorContainer.nativeElement, {
      theme: 'snow',
      placeholder: this.placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean'],
        ],
      },
    });

    if (this.value) {
      this.quill.root.innerHTML = this.value;
    }

    this.initialized = true;

    this.quill.on('text-change', () => {
      const html = this.quill.root.innerHTML;
      const cleanValue = html === '<p><br></p>' ? '' : html;
      this.value = cleanValue;
      this.onChange(cleanValue);
    });

    this.quill.on('selection-change', (range) => {
      if (!range) {
        this.onTouched();
      }
    });
  }

  writeValue(value: string): void {
    this.value = value || '';
    if (this.initialized && this.quill) {
      this.quill.root.innerHTML = this.value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy() {}
}
