import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';

import {AppComponent} from './app.component';
import {NewsViewComponent} from './news-view/news-view.component';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatDialog, MatDialogRef, MatDialogModule} from '@angular/material/dialog';
import { ProfileSelectorComponent } from './profile-selector/profile-selector.component';

@NgModule({
  declarations: [
    AppComponent,
    NewsViewComponent,
    ProfileSelectorComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    MatButtonModule, MatDialogModule,
    MatDividerModule,
    MatIconModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
