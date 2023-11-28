import {Component} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-profile-selector',
  templateUrl: './profile-selector.component.html',
  styleUrls: ['./profile-selector.component.css']
})
export class ProfileSelectorComponent {

  form: FormGroup;

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<ProfileSelectorComponent>) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.form = this.fb.group({});
  }

  save() {
    this.dialogRef.close(this.form.value);
  }

  close() {
    this.dialogRef.close();
  }
}
