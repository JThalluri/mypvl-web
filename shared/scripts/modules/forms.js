const RECAPTCHA_SITE_KEY = "6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xldallkz";

function getRecaptchaToken() {
  if (!("grecaptcha" in window) || typeof window.grecaptcha.execute !== "function") {
    return Promise.resolve("");
  }
  return window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "submit" });
}

async function submitForm(form, submitButton, onSuccess) {
  const originalHtml = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "Sending...";

  try {
    const token = await getRecaptchaToken();
    const data = new FormData(form);
    if (token) {
      data.append("g-recaptcha-response", token);
    }

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Form request failed with status ${response.status}`);
    }

    form.reset();
    onSuccess();
  } catch (error) {
    console.error("Form submission error", error);
    onSuccess();
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalHtml;
  }
}

export function attachFormSubmission(form, onSuccess) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitForm(form, submitButton, onSuccess);
  });
}

export function initQuickInquiryBehavior() {
  const quickInterest = document.getElementById("quickInterest");
  const quickSubject = document.getElementById("quickSubject");

  if (!quickInterest || !quickSubject) {
    return;
  }

  quickInterest.addEventListener("change", () => {
    if (!quickInterest.value) {
      quickSubject.value = "Quick Inquiry";
      return;
    }

    if (quickInterest.value === "Not sure") {
      quickSubject.value = "Need Guidance - Plan Selection";
      return;
    }

    quickSubject.value = `Inquiry about ${quickInterest.value}`;
  });
}
