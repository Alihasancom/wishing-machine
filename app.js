(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const cfg = window.WISHLIGHT_CONFIG || {};
  let db = null;
  if (window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
      cfg.SUPABASE_URL.startsWith("https://") && !cfg.SUPABASE_URL.includes("PASTE_") &&
      !cfg.SUPABASE_ANON_KEY.includes("PASTE_")) {
    db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  const creatorView = $("creatorView"), resultView = $("resultView"), recipientView = $("recipientView");
  const status = $("status");
  const isRecipient = new URLSearchParams(location.search).has("wish");
  const setStatus = (msg, bad = false) => { status.textContent = msg; status.style.color = bad ? "#ffb2b2" : "#ffd0a9"; };
  const humanSize = n => n < 1024*1024 ? `${Math.ceil(n/1024)} KB` : `${(n/1024/1024).toFixed(1)} MB`;
  const safeFileName = name => name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-90) || "upload";
  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const themeClass = theme => ({dreamy:"",gold:"theme-gold",garden:"theme-garden",galaxy:"theme-galaxy"}[theme] || "");
  const getFiles = id => Array.from($(id).files || []);

  function updateFileLabels() {
    const photos = getFiles("photos");
    $("photoNames").textContent = photos.length ? photos.map(f => `${f.name} (${humanSize(f.size)})`).join(" · ") : "";
    for (const [input, label] of [["video","videoName"],["music","musicName"]]) {
      const f = getFiles(input)[0]; $(label).textContent = f ? `${f.name} (${humanSize(f.size)})` : "";
    }
  }
  ["photos","video","music"].forEach(id => $(id).addEventListener("change", updateFileLabels));

  function checkSetup() {
    if (!db) throw new Error("Connect Supabase first: add your project URL and anon key in config.js, then run the SQL in supabase-setup.sql.");
  }
  function checkFiles() {
    const photos = getFiles("photos"), video = getFiles("video"), music = getFiles("music");
    if (photos.length > 6) throw new Error("Please choose no more than 6 photos.");
    if (photos.some(f => !f.type.startsWith("image/") || f.size > 5*1024*1024)) throw new Error("Each photo must be an image no larger than 5 MB.");
    if (video.length && (!video[0].type.startsWith("video/") || video[0].size > 35*1024*1024)) throw new Error("The video must be a video file no larger than 35 MB.");
    if (music.length && (!music[0].type.startsWith("audio/") || music[0].size > 12*1024*1024)) throw new Error("The music file must be audio no larger than 12 MB.");
    return {photos, video:video[0], music:music[0]};
  }
  async function uploadFile(wishId, file, folder) {
    const path = `${wishId}/${folder}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const {error} = await db.storage.from("wish-media").upload(path, file, {cacheControl:"3600", upsert:false, contentType:file.type});
    if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
    const {data} = db.storage.from("wish-media").getPublicUrl(path);
    return {url:data.publicUrl, name:file.name, type:file.type};
  }

  $("wishForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      checkSetup();
      const chosen = checkFiles();
      const recipient = $("recipient").value.trim();
      const message = $("message").value.trim();
      if (!recipient || !message) throw new Error("Please enter the birthday person's name and your message.");
      const submit = $("createButton");
      submit.disabled = true; submit.textContent = "Creating your surprise…";
      setStatus("Saving your words and preparing the memories. Please keep this tab open.");
      const id = crypto.randomUUID();
      const media = {photos:[], video:null, music:null};
      for (const file of chosen.photos) media.photos.push(await uploadFile(id,file,"photos"));
      if (chosen.video) media.video = await uploadFile(id,chosen.video,"video");
      if (chosen.music) media.music = await uploadFile(id,chosen.music,"music");
      const wish = {
        id, recipient_name:recipient, sender_name:$("sender").value.trim(),
        relationship:$("relationship").value, theme:$("theme").value,
        message, blessings:$("blessings").value.trim(), final_letter:$("letter").value.trim(),
        gift_enabled:$("gift").checked, media, created_at:new Date().toISOString()
      };
      const {error} = await db.from("birthday_wishes").insert(wish);
      if (error) throw new Error(`Could not save the wish: ${error.message}. Check the setup SQL and Supabase policies.`);
      const shareUrl = `${location.origin}${location.pathname}?wish=${encodeURIComponent(id)}`;
      $("shareUrl").value = shareUrl;
      $("previewLink").href = shareUrl;
      creatorView.classList.add("hidden"); resultView.classList.remove("hidden");
      window.scrollTo({top:0,behavior:"smooth"});
    } catch (err) {
      setStatus(err.message || "Something went wrong. Please try again.", true);
    } finally {
      const submit = $("createButton"); submit.disabled = false;
      submit.innerHTML = '<span>✦</span> Create my birthday surprise <span class="button-arrow">↗</span>';
    }
  });

  $("copyButton").addEventListener("click", async () => {
    const input = $("shareUrl");
    try { await navigator.clipboard.writeText(input.value); $("copyButton").textContent = "Copied ✓"; }
    catch { input.select(); document.execCommand("copy"); $("copyButton").textContent = "Copied ✓"; }
    setTimeout(() => $("copyButton").textContent = "Copy link", 1800);
  });
  $("newWishButton").addEventListener("click", () => { location.href = location.pathname; });

  function confetti() {
    const symbols = ["✦","✧","♥","✿","❋"];
    for (let i=0;i<32;i++) {
      const el=document.createElement("span"); el.className="confetti";
      el.textContent=symbols[Math.floor(Math.random()*symbols.length)];
      el.style.left=`${Math.random()*100}%`; el.style.color=["#ff9dce","#f7dca5","#c9b3ff","#a8e7d1"][i%4];
      el.style.animationDuration=`${3+Math.random()*3}s`; el.style.animationDelay=`${Math.random()*.8}s`;
      document.body.appendChild(el); setTimeout(()=>el.remove(),7000);
    }
  }
  function showMessage(el, text) { el.textContent = text || ""; }
  function showRecipientError() {
    $("recipientLoading").classList.add("hidden");
    $("recipientError").classList.remove("hidden");
  }
  async function loadWish() {
    recipientView.classList.remove("hidden"); creatorView.classList.add("hidden");
    resultView.classList.add("hidden");
    const id = new URLSearchParams(location.search).get("wish");
    try {
      checkSetup();
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid surprise link");
      const {data,error} = await db.from("birthday_wishes").select("id,recipient_name,sender_name,relationship,theme,message,blessings,final_letter,gift_enabled,media,created_at").eq("id",id).maybeSingle();
      if (error || !data) throw new Error("Wish not found");
      document.body.classList.add(themeClass(data.theme));
      $("recipientTitle").textContent = `Happy Birthday, ${data.recipient_name}!`;
      $("recipientSubtitle").textContent = data.sender_name ? `${data.sender_name} made something special for you.` : "Someone has a few words for you…";
      $("letterHeading").textContent = `For ${data.recipient_name}`;
      $("senderLine").textContent = data.sender_name ? `From ${data.sender_name} · ${data.relationship || "Someone special"}` : (data.relationship || "Someone special");
      showMessage($("mainMessage"),data.message);
      if (data.blessings) { showMessage($("blessingsText"),data.blessings); $("blessingsSection").classList.remove("hidden"); }
      if (data.final_letter) { showMessage($("finalLetterText"),data.final_letter); $("finalLetterSection").classList.remove("hidden"); }
      const media = data.media || {};
      if ((media.photos && media.photos.length) || media.video) {
        $("memoriesSection").classList.remove("hidden");
        for (const photo of (media.photos || [])) {
          const img=document.createElement("img"); img.src=photo.url; img.alt="A shared birthday memory"; img.loading="lazy";
          $("photoGallery").appendChild(img);
        }
        if (media.video) { $("memoryVideo").src=media.video.url; $("memoryVideo").classList.remove("hidden"); }
      }
      if (media.music && media.music.url) {
        $("backgroundMusic").src=media.music.url; $("musicButton").classList.remove("hidden");
        $("musicButton").addEventListener("click",async()=>{
          const audio=$("backgroundMusic");
          if(audio.paused){try{await audio.play();$("musicButton").textContent="♫ Pause music";}catch{$("musicButton").textContent="Tap to play music";}}
          else{audio.pause();$("musicButton").textContent="♫ Play music";}
        });
      }
      $("recipientLoading").classList.add("hidden");
      $("recipientContent").classList.remove("hidden");
      if (data.gift_enabled) {
        $("openGift").addEventListener("click",()=>{
          $("openGift").classList.add("opened"); $("giftStage").classList.add("hidden");
          $("wishLetter").classList.remove("hidden"); $("restartGift").classList.remove("hidden");
          confetti(); $("wishLetter").scrollIntoView({behavior:"smooth",block:"start"});
        });
        $("restartGift").addEventListener("click",()=>{
          $("wishLetter").classList.add("hidden"); $("restartGift").classList.add("hidden");
          $("giftStage").classList.remove("hidden"); $("openGift").classList.remove("opened");
          window.scrollTo({top:0,behavior:"smooth"});
        });
      } else {
        $("giftStage").classList.add("hidden"); $("wishLetter").classList.remove("hidden");
      }
    } catch (err) {
      console.error(err); showRecipientError();
      $("recipientError").querySelector("p").textContent = db ? "The link may be incomplete, or the surprise may have been removed." : "This website needs its Supabase setup completed before wishes can be opened.";
    }
  }
  if (isRecipient) loadWish();
})();
