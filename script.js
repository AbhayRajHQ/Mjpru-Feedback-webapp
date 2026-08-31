/* =========================================================
   CAMPUS PULSE — SCRIPT
   Sections:
   1. Preloader
   2. Navbar (scroll shadow + mobile hamburger + smooth close on link click)
   3. Scroll-reveal animations (IntersectionObserver)
   4. Gallery lightbox
   5. Feedback form validation + Formspree submission
   6. Feedback Wall render + Filter bar
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------------------------------
     1. PRELOADER
     Shows for 1.5–2s minimum, then fades out.
  --------------------------------------------------- */
  const preloader = document.getElementById("preloader");
  window.addEventListener("load", () => {
    setTimeout(() => {
      preloader.classList.add("loaded");
    }, 1600);
  });
  // Fallback in case 'load' already fired or is slow to fire
  setTimeout(() => preloader.classList.add("loaded"), 3000);


  /* ---------------------------------------------------
     2. NAVBAR — scroll shadow + hamburger menu
  --------------------------------------------------- */
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close mobile menu after tapping a link
  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });


  /* ---------------------------------------------------
     3. SCROLL REVEAL
     Fades/slides in any .reveal element as it enters view.
  --------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));


  /* ---------------------------------------------------
     4. GALLERY LIGHTBOX
  --------------------------------------------------- */
  const galleryItems = document.querySelectorAll(".gallery-item");
  const lightbox = document.getElementById("lightbox");
  const lightboxBox = document.getElementById("lightboxBox");
  const lightboxLabel = document.getElementById("lightboxLabel");
  const lightboxClose = document.getElementById("lightboxClose");

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const label = item.getAttribute("data-label");
      lightboxLabel.textContent = label;
      // Reuse the same gradient class as the clicked thumbnail for continuity
      lightboxBox.className = "lightbox-box";
      const gradientClass = [...item.classList].find((c) => c.startsWith("ph-"));
      if (gradientClass) lightboxBox.classList.add(gradientClass);
      lightbox.classList.add("open");
    });
  });

  const closeLightbox = () => lightbox.classList.remove("open");
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });


  /* ---------------------------------------------------
     5. FEEDBACK FORM — validation + submission
  --------------------------------------------------- */
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xvkozovk";

  const form = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("submitBtn");
  const toast = document.getElementById("toast");

  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    anonName: document.getElementById("anonName"),
    category: document.getElementById("category"),
    message: document.getElementById("message"),
  };

  const moodButtons = document.querySelectorAll(".mood-btn");
  const moodValueInput = document.getElementById("moodValue");
  let selectedMood = "";

  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      moodButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMood = btn.getAttribute("data-mood");
      moodValueInput.value = selectedMood;
      clearError("mood");
      toggleSubmitState();
    });
  });

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\d{10}$/;

  function validators() {
    return {
      fullName: () => fields.fullName.value.trim().length > 0,
      email: () => emailPattern.test(fields.email.value.trim()),
      phone: () => phonePattern.test(fields.phone.value.trim()),
      anonName: () => fields.anonName.value.trim().length > 0,
      category: () => fields.category.value.trim().length > 0,
      message: () => fields.message.value.trim().length >= 10,
      mood: () => selectedMood.length > 0,
    };
  }

  const errorMessages = {
    fullName: "This field is required.",
    email: "Enter a valid email.",
    phone: "Enter a valid 10-digit number.",
    anonName: "This field is required.",
    category: "Please choose a category.",
    message: "Feedback must be at least 10 characters.",
    mood: "Please select a mood.",
  };

  function showError(key) {
    const errorEl = document.getElementById(`err-${key}`);
    if (errorEl) errorEl.textContent = errorMessages[key];
    if (fields[key]) fields[key].classList.add("invalid");
    if (key === "mood") document.getElementById("moodSelector").classList.add("invalid");
  }

  function clearError(key) {
    const errorEl = document.getElementById(`err-${key}`);
    if (errorEl) errorEl.textContent = "";
    if (fields[key]) fields[key].classList.remove("invalid");
    if (key === "mood") document.getElementById("moodSelector").classList.remove("invalid");
  }

  function isFormValid() {
    const checks = validators();
    return Object.keys(checks).every((key) => checks[key]());
  }

  function toggleSubmitState() {
    submitBtn.disabled = !isFormValid();
  }

  // Live validation as the user types/selects — clears errors and toggles button
  Object.keys(fields).forEach((key) => {
    const el = fields[key];
    const evt = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(evt, () => {
      clearError(key);
      toggleSubmitState();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const checks = validators();
    let allValid = true;

    Object.keys(checks).forEach((key) => {
      if (!checks[key]()) {
        showError(key);
        allValid = false;
      } else {
        clearError(key);
      }
    });

    if (!allValid) return;

    // Show loading state on the button
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    const payload = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      anonName: fields.anonName.value.trim(),
      category: fields.category.value,
      message: fields.message.value.trim(),
      mood: selectedMood,
    };

    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Network/CORS issues shouldn't block the demo UX — still show success state.
      console.error("Feedback submission error:", err);
    } finally {
      submitBtn.classList.remove("loading");
      showToast();
      form.reset();
      moodButtons.forEach((b) => b.classList.remove("selected"));
      selectedMood = "";
      moodValueInput.value = "";
      submitBtn.disabled = true;
    }
  });

  function showToast() {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }


  /* ---------------------------------------------------
     6. FEEDBACK WALL — render placeholder data + filters
  --------------------------------------------------- */
  const wallData = [
    { name: "NightOwl23", category: "Mess Food", mood: "😠", message: "Food quality has dropped a lot this semester, especially dinner." },
    { name: "SilentCoder", category: "Hostel", mood: "😐", message: "WiFi in the hostel disconnects every evening around 8-9 PM." },
    { name: "BookWorm99", category: "Academics", mood: "😊", message: "Loved the new elective system, more flexibility this year." },
    { name: "GhostStudent", category: "Facilities", mood: "😠", message: "Washrooms near the CS block need urgent cleaning." },
    { name: "PixelDreamer", category: "Faculty", mood: "😊", message: "Professors in the CSE dept are really approachable for doubts." },
    { name: "QuietRaven", category: "Hostel", mood: "😠", message: "Water supply gets cut without any prior notice." },
    { name: "CampusCat", category: "Academics", mood: "😐", message: "Exam timetable clashed with two subjects on the same day." },
    { name: "UnknownUser42", category: "Other", mood: "😊", message: "Great initiative starting this feedback portal, finally being heard!" },
    { name: "MidnightOwl", category: "Mess Food", mood: "😐", message: "Breakfast variety could be improved, same menu every day." },
    { name: "DataDreamer", category: "Facilities", mood: "😠", message: "Library AC isn't working properly during peak summer hours." },
  ];

  const categoryMeta = {
    "Mess Food": { tagClass: "tag-mess", tape: "var(--coral)" },
    "Hostel": { tagClass: "tag-hostel", tape: "var(--teal)" },
    "Academics": { tagClass: "tag-academics", tape: "#7d6dd6" },
    "Faculty": { tagClass: "tag-faculty", tape: "var(--amber)" },
    "Facilities": { tagClass: "tag-facilities", tape: "var(--teal-dark)" },
    "Other": { tagClass: "tag-other", tape: "var(--ink-soft)" },
  };

  const wallGrid = document.getElementById("wallGrid");

  function renderWall() {
    wallGrid.innerHTML = "";
    wallData.forEach((entry, i) => {
      const meta = categoryMeta[entry.category] || categoryMeta["Other"];
      const tilt = (i % 2 === 0 ? -1 : 1) * (1 + (i % 3));

      const card = document.createElement("article");
      card.className = "wall-card reveal";
      card.style.setProperty("--tilt", `${tilt}deg`);
      card.style.setProperty("--tape-color", meta.tape);
      card.dataset.category = entry.category;

      card.innerHTML = `
        <div class="card-top">
          <span class="card-tag ${meta.tagClass}">${entry.category}</span>
          <span class="card-mood">${entry.mood}</span>
        </div>
        <p class="card-message">${entry.message}</p>
        <p class="card-author">${entry.name}</p>
      `;

      wallGrid.appendChild(card);
      revealObserver.observe(card);
    });
  }

  renderWall();

  /* Filter bar — client-side only */
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");
      document.querySelectorAll(".wall-card").forEach((card) => {
        const match = filter === "All" || card.dataset.category === filter;
        card.classList.toggle("hidden", !match);
      });
    });
  });

});
