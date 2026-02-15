import { attachFormSubmission, initQuickInquiryBehavior } from "./forms.js";

function showModal(modal) {
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function hideModal(modal) {
  modal.style.display = "none";
  document.body.style.overflow = "";
}

function bindDismiss(modal, closeSelectors = []) {
  closeSelectors.forEach((selector) => {
    const trigger = document.querySelector(selector);
    trigger?.addEventListener("click", () => hideModal(modal));
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideModal(modal);
    }
  });
}

function initSuccessModal() {
  const successModal = document.getElementById("successModal");
  if (!successModal) {
    return null;
  }

  bindDismiss(successModal, ["#closeModal", "#closeModalBtn"]);
  return {
    show: () => showModal(successModal),
    hide: () => hideModal(successModal),
  };
}

function initFloatingContact(success) {
  const floatingButton = document.getElementById("floatingContactBtn");
  const contactModal = document.getElementById("contactModal");
  const contactForm = document.getElementById("modalContactForm");

  if (!floatingButton || !contactModal) {
    return;
  }

  floatingButton.addEventListener("click", () => showModal(contactModal));
  bindDismiss(contactModal, ["#contactModalClose"]);

  if (contactForm && success) {
    attachFormSubmission(contactForm, () => {
      hideModal(contactModal);
      success.show();
    });
  }
}

function initQuickContact(success) {
  const quickModal = document.getElementById("quickContactModal");
  const quickForm = document.getElementById("quickContactForm");

  if (!quickModal) {
    return;
  }

  bindDismiss(quickModal, ["#quickContactModalClose"]);
  initQuickInquiryBehavior();

  document.querySelectorAll(".pricing-button, .book-demo-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const planName = button.closest(".pricing-card")?.querySelector(".pricing-title")?.textContent?.trim();
      const quickInterest = document.getElementById("quickInterest");
      const quickSubject = document.getElementById("quickSubject");

      if (button.classList.contains("book-demo-btn")) {
        if (quickInterest) {
          quickInterest.value = "Not sure";
        }
        if (quickSubject) {
          quickSubject.value = "Free Live Demo Request";
        }
        const quickMessage = document.getElementById("quickMessage");
        if (quickMessage) {
          quickMessage.value =
            "I'm interested in booking a free live demo to see how this could work for my video library.";
        }
      } else if (planName && quickInterest && quickSubject) {
        quickInterest.value = `${planName} Plan`;
        quickSubject.value = `Inquiry about ${planName} Plan`;
      }

      showModal(quickModal);
    });
  });

  if (quickForm && success) {
    attachFormSubmission(quickForm, () => {
      hideModal(quickModal);
      success.show();
      const quickSubject = document.getElementById("quickSubject");
      if (quickSubject) {
        quickSubject.value = "Quick Inquiry";
      }
    });
  }
}

function initStandaloneContact(success) {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm || !success) {
    return;
  }

  attachFormSubmission(contactForm, () => success.show());
}

function initExitIntent() {
  const popup = document.getElementById("exitPopup");
  if (!popup || sessionStorage.getItem("exitPopupShown")) {
    return;
  }

  const close = () => hideModal(popup);
  bindDismiss(popup, ["#exitPopupClose", "#exitPopupNo"]);

  document.getElementById("exitPopupYes")?.addEventListener("click", () => {
    close();
    const contactModal = document.getElementById("contactModal");
    if (contactModal) {
      showModal(contactModal);
      const subject = document.getElementById("modalSubject");
      if (subject) {
        subject.value = "Free 15-Minute Consultation Request";
      }
    }
  });

  const trigger = () => {
    if (sessionStorage.getItem("exitPopupShown")) {
      return;
    }
    sessionStorage.setItem("exitPopupShown", "1");
    showModal(popup);
  };

  document.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget && event.clientY <= 20) {
      trigger();
    }
  });
}

export function initModalFeatures() {
  const success = initSuccessModal();
  initFloatingContact(success);
  initQuickContact(success);
  initStandaloneContact(success);
  initExitIntent();

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    document.querySelectorAll(".modal, .exit-popup").forEach((el) => {
      if (getComputedStyle(el).display !== "none") {
        hideModal(el);
      }
    });
  });
}
