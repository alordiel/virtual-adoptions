/**
 * @var vaL10N object
 * @property successfulSubscription string
 * @property canNotBeEmpty string
 * @property passNoMatch string
 * @property ajaxURL string
 * @property confirmCancellation string
 * @property noEmail string
 */

// Payment and checkout page scripts
document.addEventListener('DOMContentLoaded', function () {

  // Change on the gift-donation option. Shows/hides the gift's email field.
  if (document.getElementById('gift-donation') !== null) {
    document.getElementById('gift-donation').addEventListener('change', (e) => {
      if (e.target.checked) {
        document.querySelector('.email-gift').style.display = 'block';
      } else {
        document.querySelector('.email-gift').style.display = 'none';
      }
    });
  }

  // Adds the registration functionality
  if (document.getElementById('register-user') !== null) {
    document.getElementById('register-user').addEventListener('click', function (element) {

      if (!validateContactForm()) {
        return;
      }

      element.disabled = true;

      const registrationData = {
        action: 'va_register_new_user',
        security: document.getElementById('turbo-security').value,
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        pass: document.getElementById('password').value,
        terms: document.getElementById('terms').checked
      };

      makeAjaxCall(registrationData)
        .then(response => {
          if (response.status === 1) {
            location.reload();
          }
          element.disabled = false;
        })
        .catch(error => {
          alert(error);
          element.disabled = false;
        })
    });
  }

  // Change of the amount for donation. Adds the subscription plan ID into hidden input
  if (document.getElementsByName('selected-amount') !== null) {
    document.getElementsByName('selected-amount').forEach((e) => {
      e.addEventListener('change', function (element) {
        const selectedAmount = document.querySelector('.selected-donation-amount');
        if (selectedAmount !== null) {
          selectedAmount.classList.remove('selected-donation-amount');
        }
        document.getElementById('plan-id').value = element.target.dataset.subscription;
        element.target.parentNode.classList.add('selected-donation-amount');
      })
    });
  }

  // Render the PayPal Button
  if (document.getElementById('paypal-button-container') !== null) {
    /**
     * @var paypal
     */
    paypal.Buttons({
      onInit: function (data, actions) {
        // Disable the buttons
        actions.disable();
        const planID = document.getElementById('plan-id');
        const terms = document.getElementById('terms');
        const giftCheckbox = document.getElementById('gift-donation');
        const giftEmail = document.getElementById('email-gift');
        // Listen for changes to the checkbox
        terms.addEventListener('change', function () {
          const validGift = (giftCheckbox.checked && giftEmail.value !== '') || !giftCheckbox.checked;
          (terms.checked && planID.value !== '' && validGift) ? actions.enable() : actions.disable();
        });
        // Listen for changes to hidden input for the value of the selected plan
        planID.addEventListener('change', function () {
          const validGift = (giftCheckbox.checked && giftEmail.value !== '') || !giftCheckbox.checked;
          (terms.checked && planID.value !== '' && validGift) ? actions.enable() : actions.disable();
        });
        // Listen to changes in the checkbox of the gift
        giftCheckbox.addEventListener('change', function () {
          const validGift = (giftCheckbox.checked && giftEmail.value !== '') || !giftCheckbox.checked;
          (terms.checked && planID.value !== '' && validGift) ? actions.enable() : actions.disable();
        });
        // Listen to changes in the gift email filed
        giftEmail.addEventListener('change', function () {
          const validGift = (giftCheckbox.checked && giftEmail.value !== '') || !giftCheckbox.checked;
          (terms.checked && planID.value !== '' && validGift) ? actions.enable() : actions.disable();
        });
      },
      onClick: function () {
        validateDonationFields();
      },
      createSubscription: function (data, actions) {
        return actions.subscription.create({
          'plan_id': document.getElementById('plan-id').value
        });
      },
      onApprove: async function (data) {
        await storePaymentToDB(data.subscriptionID);
        alert(vaL10N.successfulSubscription);
      }
    }).render('#paypal-button-container');
  }

  // Cancelling subscription (fired from My-subscriptions page)
  if (document.querySelector('.cancel-button') !== null) {
    document.querySelectorAll('.cancel-button').forEach((element) => {
      element.addEventListener('click', function (e) {
        e.preventDefault();
        const cancellationButton = e.target;
        // check if it is not already clicked
        if (cancellationButton.classList.contains('disable-action')) {
          return;
        }

        if (!confirm(vaL10N.confirmCancellation)) {
          return;
        }

        const postData = {
          post_id: e.target.dataset.postId,
          security: document.getElementById('turbo-security').value,
          action: 'va_cancel_subscription_ajax',
        };

        // disable the link
        cancellationButton.classList.add('disable-action');

        makeAjaxCall(postData)
          .then(success => {
            alert(success.data.message);
            // replace the subscription status
            document.querySelector('.card-id-' + postData.post_id + ' .subscription-status').innerText = success.data.status; // this could be only "Cancelled"
            document.querySelector('.card-id-' + postData.post_id + ' .next-due-date').remove(); // remove due date
            cancellationButton.remove();
          })
          .catch(error => {
            alert(error);
            cancellationButton.classList.remove('disable-action');
          });
        return false; // since this is clicked link, always return false
      });
    });
  }

  if (document.querySelector('.vir-adopt-login') !== null) {
    // Handles the displaying and hiding the "Lost password" form.
    const lostPassForm = document.getElementById('lost-password-block');
    const loginForm = document.getElementById('login-block');

    document.getElementById('go-to-reset-password').addEventListener('click', function (e) {
      e.preventDefault();
      loginForm.style.display = 'none';
      lostPassForm.style.display = 'block';
    });

    document.getElementById('go-back-to-login').addEventListener('click', function (e) {
      e.preventDefault();
      lostPassForm.style.display = 'none';
      loginForm.style.display = 'block';
    });

    // Sending request for resetting the password
    document.getElementById('submit-reset-password').addEventListener('click', function (e) {
      e.preventDefault();
      const email = document.getElementById('user_login').value;
      const messageBox = document.querySelector('.message-box');

      clearMessageBox(messageBox);

      if (email === '') {
        messageBox.innerText = vaL10N.noEmail;
        messageBox.classList.add('error-message')
        return;
      }

      sendResetPasswordEmail(email, messageBox)
    });

    // prevent submitting of the login form when the `enter` key is pressed on password-reset-form
    document.getElementById('user_login').addEventListener('keydown', function (e) {
      if (e.code === 'Enter') {
        e.preventDefault();
        document.getElementById('submit-reset-password').click();
      }
    })
  }

  function sendResetPasswordEmail(email, messageBox) {

    const data = {
      email,
      action: "va_reset_users_password",
      security: document.getElementById('login-security').value,
    };

    makeAjaxCall(data)
      .then((success) => {
        messageBox.innerText = success.message;
        messageBox.classList.add('success-message');
      }).catch((error) => {
      messageBox.innerText = error;
      messageBox.classList.add('error-message');
    });
  }

  function clearMessageBox(messageBox) {
    clearMessageBox.classList = ['message-box'];
    clearMessageBox.innerText = '';
  }

  // Used to validate the contact fields when a non-logged in user is adding a donation
  function validateContactForm() {
    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const email = document.getElementById('email');
    const pass = document.getElementById('password');
    const pass2 = document.getElementById('re-password');
    const terms = document.getElementById('terms');
    const fields = [firstName, lastName, email, pass, pass2];
    let hasError = false;

    // clear all previous errors
    for (let element of fields) {
      element.nextElementSibling.innerText = '';
      element.style.borderColor = 'inherit';
    }
    if (!firstName.value) {
      firstName.nextElementSibling.innerText = vaL10N.canNotBeEmpty;
      firstName.style.borderColor = 'red';
      hasError = true;
    }

    if (!lastName.value) {
      lastName.nextElementSibling.innerText = vaL10N.canNotBeEmpty;
      lastName.style.borderColor = 'red';
      hasError = true;
    }

    if (!email.value) {
      email.nextElementSibling.innerText = vaL10N.canNotBeEmpty;
      email.style.borderColor = 'red';
      hasError = true;
    }

    if (!pass.value) {
      pass.nextElementSibling.innerText = vaL10N.canNotBeEmpty;
      pass.style.borderColor = 'red';
      hasError = true;
    }
    if (!pass2.value) {
      pass2.nextElementSibling.innerText = vaL10N.canNotBeEmpty;
      pass2.style.borderColor = 'red';
      hasError = true;
    }

    if (pass.value !== pass2.value) {
      pass.nextElementSibling.innerText = vaL10N.passNoMatch;
      pass.style.borderColor = 'red';
      hasError = true;
    }

    const termsErrorField = document.getElementById('terms-error');
    if (!terms.checked) {
      termsErrorField.classList.remove('hidden');
      hasError = true;
    } else {
      termsErrorField.classList.add('hidden')
    }


    if (hasError) {
      document.querySelector('.contact-details').scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      });
      return false;
    }

    return true;
  }

  // Validates the selected amount, the gift fields, animal ID and selected terms
  function validateDonationFields() {
    // Show a validation error if the checkbox for "Terms & Conditions" is not checked
    if (!document.getElementById('terms').checked) {
      document.getElementById('terms-error').classList.remove('hidden');
    } else {
      document.getElementById('terms-error').classList.add('hidden');
    }

    // Show a validation error if there is no selected subscription plan
    if (document.getElementById('plan-id').value === '') {
      document.getElementById('subscription-plan-error').classList.remove('hidden');
    } else {
      document.getElementById('subscription-plan-error').classList.add('hidden');
    }

    // Check if the gift checkbox is checked and if there is a value for it
    if (document.getElementById('gift-donation').checked && document.getElementById('email-gift').value === '') {
      document.getElementById('gift-email-error').classList.remove('hidden');
    } else {
      document.getElementById('gift-email-error').classList.add('hidden');
    }

    // Checks if there is an animal selected for donation
    const animalID = document.getElementById('animal-id');
    if (animalID === null || animalID.value === '') {
      document.getElementById('missing-animal-error').classList.remove('hidden');
    } else {
      document.getElementById('missing-animal-error').classList.add('hidden');
    }
  }

  // Gets the value of the donation amount
  function getDonationAmount() {
    let donationValue = document.querySelector("input[name='selected-amount']:checked").value;
    return parseFloat(donationValue);
  }

  function makeAjaxCall(postData) {
    return new Promise((resolve, reject) => {
      jQuery.ajax({
        url: vaL10N.ajaxURL,
        data: postData,
        method: 'POST',
        dataType: 'JSON',
        success: (response) => {
          if (response.status === 1) {
            resolve(response);
          } else {
            reject(response.message);
          }
        },
        error: (xhrObj, status, message) => {
          reject(status + ': ' + message);
        }
      });
    });
  }

  async function storePaymentToDB(subscriptionID) {

    const giftEmail = document.getElementById('gift-donation').checked ? document.getElementById('email-gift').value : '';
    const postData = {
      security: document.getElementById('turbo-security').value,
      action: 'va_create_new_donation_subscription',
      giftEmail: giftEmail,
      animalID: document.getElementById('animal-id').value,
      donationAmount: getDonationAmount(),
      acceptedTerms: document.getElementById('terms').checked,
      subscriptionID: subscriptionID,
      subscriptionPlanID: document.getElementById('plan-id').value,
    };

    // send results
    await makeAjaxCall(postData)
      .then((response) => {
        location.href = response.data.redirect_to;
      })
      .catch((message) => {
        alert(message)
        document.getElementById('submit-sponsorship').target.disabled = false;
      });
  }
});

