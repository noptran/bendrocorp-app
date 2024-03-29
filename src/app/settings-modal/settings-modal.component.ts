import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../auth.service';
import { NewPassword, TwoFactorDataObject, TwoFactorAuthObject, UserSessionResponse, TokenObject } from '../models/user-models';
import { MessageService } from '../message/message.service';
import { HttpErrorResponse } from '@angular/common/http';
import { OauthService } from '../oauth/oauth.service';
import { OAuthToken } from '../models/misc-models';
import { Router } from '@angular/router';

@Component({
  selector: 'settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.css']
})
export class SettingsModalComponent implements OnInit {
  openModal: NgbModalRef;
  passwordChange: NewPassword;
  changeEmail: string;
  changeEmailPassword: string;
  endMembershipPassword: string;
  tfaDataObject: TwoFactorDataObject;
  tfaAuthObject: TwoFactorAuthObject;
  oAuthTokens: OAuthToken[] = [];
  tokens: TokenObject[] = [];
  user = this.authService.retrieveUserSession() as UserSessionResponse;
  tfa_enabled: boolean = this.user.tfa_enabled || this.checkSessTfaEnabled();

  constructor(private modalService: NgbModal, private router: Router, private authService:AuthService, private messageService:MessageService, private oAuthService:OauthService) {}

  doChangePassword()
  {
    if (this.passwordChange.original_password && this.passwordChange.password && this.passwordChange.password_confirmation && this.passwordChange.password === this.passwordChange.password_confirmation) {
      this.authService.changePassword(this.passwordChange).subscribe(
        (result) => {
          if (!(result instanceof HttpErrorResponse)) {
            this.passwordChange = { } as NewPassword
            this.messageService.addSuccess("Password successfully changed!")
          }
        }
      )
    }else{
      this.messageService.addError("Password form not filled out correctly!")
    }
  }

  doRequestTfa()
  {
    this.authService.fetchTfa().subscribe(
      (results) => {
        if (!(results instanceof HttpErrorResponse)) {
          this.tfaDataObject = results
          this.tfaAuthObject = { } as TwoFactorAuthObject
        }
      }
    )
  }

  doEnableTfa()
  {
    this.authService.enableTfa(this.tfaAuthObject).subscribe(
      (result) => {
        if (!(result instanceof HttpErrorResponse)) {          
          // this.user.tfa_enabled = true
          // this.authService.setSession(this.user)
          sessionStorage.setItem('sess_tfa_enabled', 'true');
          this.authService.refreshData()
        }
      }
    )
  }

  checkSessTfaEnabled(): boolean {
    let val = sessionStorage.getItem('sess_tfa_enabled')
    return (val == 'true')
  }

  doCancelMembership()
  {
    // this.messageService.addInfo("The one click button is currently not available. If you would like to end your membership please contact your Director via Discord.")
    if (this.endMembershipPassword) {
      this.authService.terminateMembership(this.endMembershipPassword).subscribe((results) => {
        if (!(results instanceof HttpErrorResponse)) {
          this.endMembershipPassword = null;
          this.authService.logout();
          this.messageService.addSuccess('Your membership to BendroCorp has been ended!')
          this.router.navigateByUrl('/');
          this.close();
        }
      })
    } else {
      this.messageService.addError("You must enter your password!")
    }
  }

  fetchAuthTokens()
  {
    this.authService.fetchAuthTokens().subscribe(
      (results) => {
        if (!(results instanceof HttpErrorResponse)) {
          this.tokens = results
        }
      }
    )
  }

  fetchOAuthTokens()
  {
    this.oAuthService.fetch_tokens().subscribe(
      (results) => {
        if (!(results instanceof HttpErrorResponse)) {
          this.oAuthTokens = results
        }
      }
    )
  }

  removeAuthToken(token:TokenObject)
  {
    if (this.tokens.length > 0 && token) {
      if (confirm("Are you sure you want to revoke this token?")) {
        this.authService.removeAuthToken(token.token).subscribe(
          (results) => {
            if (!(results instanceof HttpErrorResponse)) {
              this.tokens.splice(this.tokens.findIndex(x => x.token == token.token), 1)
              this.messageService.addSuccess("Auth token removed!")
            }
          }
        )
      }
    }
  }

  revokeOAuthToken(token:OAuthToken)
  {
    if (this.oAuthTokens.length > 0 && token) {
      if (confirm("Are you sure you want to revoke this applications access to your data?")) {
        this.oAuthService.remove_token(token.token).subscribe(
          (results) => {
            if (!(results instanceof HttpErrorResponse)) {
              this.oAuthTokens.splice(this.oAuthTokens.findIndex(x => x.token == token.token), 1)
            }
          }
        )
      }
    }
  }

  doChangeEmail()
  {
    if (this.changeEmail) {
      this.authService.doUpdateEmail(this.changeEmail, this.changeEmailPassword).subscribe(
        (results) => {
          if (!(results instanceof HttpErrorResponse)) {
            this.messageService.addSuccess("Email updated successfully!")
            this.changeEmail = null
            this.changeEmailPassword = null
          }
        }
      )
    }
  }

  open(content) {
    this.passwordChange = { } as NewPassword
    this.openModal = this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'})
  }

  /**
   * Close the modal
   */
  close()
  {
    this.openModal.close()
  }

  ngOnInit() {
    this.fetchOAuthTokens()
    this.fetchAuthTokens()
  }

}
