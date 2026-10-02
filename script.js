/* =========================================================
   B & O Upholstery – homepage behaviour
   1. Mobile menu
   2. Photo upload (choose / drag and drop, thumbnails, remove)
   3. Quote form (validation and sending)
   ========================================================= */

/* ---------------------------------------------------------
   SETTINGS – change these to connect the form.
   FORM_ENDPOINT is the web address the quote form is sent to.
   For example a Formspree form URL like
   "https://formspree.io/f/abcdwxyz". See README.md.
   While it is empty, the form shows a friendly message asking
   people to call or email instead.
   --------------------------------------------------------- */
const FORM_ENDPOINT = "";

const MAX_FILES = 10;
const MAX_FILE_MB = 10;
const RESIZE_TO_PX = 2000;   // longest side after compression
const JPEG_QUALITY = 0.85;

/* ---------- 1. Mobile menu ---------- */
(function setupMenu() {
  const menu = document.getElementById("mobile-menu");
  const openBtn = document.querySelector(".menu-toggle");
  const closeBtn = document.querySelector(".menu-close");

  function openMenu() {
    menu.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function closeMenu() {
    menu.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", function () {
    closeMenu();
    openBtn.focus();
  });
  // Close the menu after a link inside it is tapped
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) closeMenu();
  });
})();

/* ---------- 2. Photo upload ---------- */
let files = []; // the photos the visitor has chosen

const uploadArea = document.getElementById("upload");
const photoInput = document.getElementById("photo-input");
const uploadTitle = document.getElementById("upload-title");
const uploadHint = document.getElementById("upload-hint");
const thumbs = document.getElementById("thumbs");
const uploadNote = document.getElementById("upload-note");

function addFiles(fileList) {
  const skipped = [];
  Array.from(fileList).forEach(function (file) {
    if (!file.type.startsWith("image/")) {
      skipped.push(file.name + " is not a photo");
    } else if (files.length >= MAX_FILES) {
      skipped.push(file.name + " (you can add up to " + MAX_FILES + " photos)");
    } else {
      files.push(file);
    }
  });
  showUploadNote(skipped.length ? "Not added: " + skipped.join(", ") + "." : "");
  renderFiles();
}

function showUploadNote(text) {
  uploadNote.textContent = text;
  uploadNote.hidden = !text;
}

function renderFiles() {
  const n = files.length;
  if (n) {
    uploadTitle.textContent = n + " photo" + (n > 1 ? "s" : "") + " added";
    uploadHint.textContent = "Tap to add more photos.";
  } else {
    uploadTitle.textContent = "Add photos of your piece";
    uploadHint.textContent = "Drop several photos here, or tap to choose them from your device.";
  }

  // Free memory used by old thumbnails, then redraw them
  thumbs.querySelectorAll("img").forEach(function (img) {
    URL.revokeObjectURL(img.src);
  });
  thumbs.innerHTML = "";
  files.forEach(function (file, index) {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "Photo " + (index + 1) + ": " + file.name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "thumb-remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove photo " + (index + 1));
    remove.addEventListener("click", function () {
      files.splice(index, 1);
      showUploadNote("");
      renderFiles();
    });
    li.appendChild(img);
    li.appendChild(remove);
    thumbs.appendChild(li);
  });
  thumbs.hidden = n === 0;
}

photoInput.addEventListener("change", function () {
  addFiles(photoInput.files);
  photoInput.value = ""; // lets the same photo be picked again after removing it
});

// Drag and drop
["dragenter", "dragover"].forEach(function (type) {
  uploadArea.addEventListener(type, function (e) {
    e.preventDefault();
    uploadArea.classList.add("is-dragging");
  });
});
["dragleave", "drop"].forEach(function (type) {
  uploadArea.addEventListener(type, function (e) {
    e.preventDefault();
    uploadArea.classList.remove("is-dragging");
  });
});
uploadArea.addEventListener("drop", function (e) {
  if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
});

/* Shrink a large photo in the browser before sending it.
   If anything goes wrong, the original photo is sent instead. */
function compressImage(file) {
  return new Promise(function (resolve) {
    // Small files and GIFs are sent as they are
    if (file.size < 1.5 * 1024 * 1024 || file.type === "image/gif") {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      const scale = Math.min(1, RESIZE_TO_PX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) {
        if (!blob || blob.size >= file.size) {
          resolve(file);
          return;
        }
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        resolve(new File([blob], name, { type: "image/jpeg" }));
      }, "image/jpeg", JPEG_QUALITY);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/* ---------- 3. Quote form ---------- */
const form = document.getElementById("quote-form");
const submitBtn = document.getElementById("submit-btn");
const formMessage = document.getElementById("form-message");
const formSuccess = document.getElementById("form-success");

function setError(name, message) {
  const field = form.elements[name].closest(".field");
  const errorEl = field.querySelector(".field-error");
  field.classList.toggle("has-error", Boolean(message));
  form.elements[name].setAttribute("aria-invalid", message ? "true" : "false");
  errorEl.textContent = message || "";
  errorEl.hidden = !message;
}

function validate() {
  const firstName = form.elements.first_name.value.trim();
  const email = form.elements.email.value.trim();
  const phone = form.elements.phone.value.trim();
  const comments = form.elements.comments.value.trim();
  let firstProblem = null;

  ["first_name", "last_name", "email", "phone", "comments"].forEach(function (n) {
    setError(n, "");
  });

  if (!firstName) {
    setError("first_name", "Please add your first name.");
    firstProblem = firstProblem || "first_name";
  }
  if (!email && !phone) {
    setError("email", "Please add an email or a phone number.");
    setError("phone", "Please add a phone number or an email.");
    firstProblem = firstProblem || "email";
  } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Please check this email address.");
    firstProblem = firstProblem || "email";
  }
  if (!comments) {
    setError("comments", "Please tell us a little about the piece.");
    firstProblem = firstProblem || "comments";
  }

  if (firstProblem) form.elements[firstProblem].focus();
  return !firstProblem;
}

function showFormMessage(html) {
  formMessage.innerHTML = html;
  formMessage.hidden = !html;
}

const CONTACT_FALLBACK =
  'Please call us at <a href="tel:6045039490">(604) 503-9490</a> or email ' +
  '<a href="mailto:boupholstery@hotmail.com">boupholstery@hotmail.com</a>.';

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  showFormMessage("");
  if (!validate()) return;

  if (!FORM_ENDPOINT) {
    showFormMessage("Online quotes are not switched on yet. " + CONTACT_FALLBACK);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try {
    const data = new FormData(form);
    const prepared = await Promise.all(files.map(compressImage));
    const tooBig = prepared.filter(function (f) {
      return f.size > MAX_FILE_MB * 1024 * 1024;
    });
    if (tooBig.length) {
      throw new Error("too-big");
    }
    prepared.forEach(function (file) {
      data.append("photos", file, file.name);
    });

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error("send-failed");

    // Success: swap the form for the thank-you message
    form.hidden = true;
    formSuccess.hidden = false;
    files = [];
    renderFiles();
  } catch (err) {
    if (err.message === "too-big") {
      showFormMessage("One of the photos is larger than " + MAX_FILE_MB + " MB. Please remove it and try again.");
    } else {
      showFormMessage("Sorry, something went wrong sending your request. " + CONTACT_FALLBACK);
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send request";
  }
});
