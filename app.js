/*
  YOURBRAND DASHBOARD
  ===================
  This file controls the interactive dashboard pages.

  QUICK GUIDE
  1. Demo data and browser storage
  2. Reusable display helpers
  3. Page layouts: Overview, Calendar, Updates, Resources,
     Saved Items, Profile, Settings, Messages and Help
  4. Calendar event modal
  5. Page-specific interactions and navigation
  6. Theme and startup

  To change page appearance, edit global.css.
  To change starter content, edit defaultData and resourceData below.
  This is a front-end prototype; connect a backend for real accounts and sync.
*/

/* YourBrand dashboard
   Data is stored in this browser with localStorage. This is a front-end demo;
   connect a server/database for multi-user accounts and cross-device sync.
*/
const STORE_KEY = "yourbrand-dashboard-v1";
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const defaultData = {
  profile:{name:"Alex Morgan",email:"alex@example.com",bio:"Welcome to my workspace.",location:"Phoenix, AZ"},
  events:[
    {id:"e1",title:"Project planning",date:todayISO(),time:"10:00",notes:"Review the next steps."},
    {id:"e2",title:"Team check-in",date:todayISO(),time:"14:30",notes:"Weekly progress meeting."}
  ],
  saved:[
    {id:"s1",title:"Getting started guide",description:"A quick introduction to the workspace.",category:"Guide"},
    {id:"s2",title:"Keyboard shortcuts",description:"Helpful shortcuts to work faster.",category:"Tip"}
  ],
  completedTasks:[],
  theme:"light",
  notifications:true
};
let data = loadData();
let currentPage = "overview";
let calendarDate = new Date();
let toastTimer;

function loadData(){
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY));
    return stored ? {...structuredClone(defaultData),...stored,
      profile:{...defaultData.profile,...stored.profile},
      events:stored.events || [], saved:stored.saved || []} : structuredClone(defaultData);
  } catch { return structuredClone(defaultData); }
}
function persist(){ localStorage.setItem(STORE_KEY,JSON.stringify(data)); updateUserLabels(); }
function esc(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(message){
  const el=document.getElementById("toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}
function updateUserLabels(){
  const name=data.profile.name || "User", initial=name.trim().charAt(0).toUpperCase() || "U";
  ["topUserName","sideUserName"].forEach(id=>document.getElementById(id).textContent=name);
  ["topAvatar","sideAvatar"].forEach(id=>document.getElementById(id).textContent=initial);
  document.getElementById("eventCount").textContent=data.events.length;
}
function heading(title,subtitle,action=""){
  return `<div class="page-heading"><div><p class="eyebrow">Workspace</p><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
}
function card(content){return `<section class="content-card">${content}</section>`;}
function empty(text){return `<div class="empty-state">${text}</div>`;}
function eventList(limit=5){
  const events=[...data.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,limit);
  if(!events.length)return empty("No calendar events yet. Add one to get started.");
  return `<div class="list">${events.map(e=>`<div class="list-row"><span class="pill blue">${esc(e.date)}</span><div class="list-row-main"><strong>${esc(e.title)}</strong><small>${esc(e.time||"All day")} · ${esc(e.notes||"No notes")}</small></div><button class="icon-button" data-edit-event="${e.id}" title="Edit event">✎</button></div>`).join("")}</div>`;
}
function savedList(limit=4){
  const items=data.saved.slice(0,limit);
  if(!items.length)return empty("Nothing saved yet. Save a resource to see it here.");
  return `<div class="list">${items.map(item=>`<div class="list-row"><span class="pill">☆ ${esc(item.category)}</span><div class="list-row-main"><strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></div><button class="icon-button" data-remove-saved="${item.id}" title="Remove saved item">×</button></div>`).join("")}</div>`;
}
function renderOverview(){
  return heading("Overview","Your workspace at a glance.",`<button class="button" data-action="add-event">＋ Add event</button>`)
  + `<div class="stats-grid"><div class="stat-card"><span>Calendar events</span><strong>${data.events.length}</strong></div><div class="stat-card"><span>Saved items</span><strong>${data.saved.length}</strong></div><div class="stat-card"><span>Workspace status</span><strong style="font-size:1.2rem;color:var(--color-success)">Active</strong></div></div>`
  + `<div class="grid-two"><div>${card(`<div class="welcome-panel"><p class="eyebrow">Welcome back</p><h2>Hello, ${esc(data.profile.name.split(" ")[0])}!</h2><p>Use your workspace to organize events, follow updates, save useful resources, and manage your profile.</p><div class="toolbar"><button class="button" data-page="calendar">Open calendar</button><button class="button button--secondary" data-page="resources">Browse resources</button></div></div>`)}${card(`<h2>Upcoming events</h2>${eventList(4)}`)}</div><div>${card(`<h2>Quick links</h2><div class="list"><div class="list-row"><div class="list-row-main"><strong>Calendar</strong><small>Plan and manage your events</small></div><button class="button button--secondary" data-page="calendar">Open</button></div><div class="list-row"><div class="list-row-main"><strong>Updates</strong><small>See the latest workspace news</small></div><button class="button button--secondary" data-page="updates">Open</button></div><div class="list-row"><div class="list-row-main"><strong>Saved items</strong><small>Return to useful content</small></div><button class="button button--secondary" data-page="saved">Open</button></div></div>`)}${card(`<h2>Saved items</h2>${savedList(3)}`)}</div></div>`;
}
function renderCalendar(){
  const year=calendarDate.getFullYear(),month=calendarDate.getMonth();
  const first=new Date(year,month,1), start=new Date(year,month,1-first.getDay());
  const monthName=calendarDate.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  let days="";
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const todaysEvents=data.events.filter(e=>e.date===iso);
    days+=`<button class="calendar-day ${d.getMonth()!==month?"outside":""} ${iso===todayISO()?"today":""}" data-calendar-date="${iso}"><span class="day-number">${d.getDate()}</span>${todaysEvents.slice(0,2).map(e=>`<span class="event-chip" data-edit-event="${e.id}">${esc(e.time||"")} ${esc(e.title)}</span>`).join("")}${todaysEvents.length>2?`<small>+${todaysEvents.length-2} more</small>`:""}</button>`;
  }
  return heading("Calendar","Create events and keep track of important dates.",`<button class="button" data-action="add-event">＋ Add event</button>`)
  + card(`<div class="calendar-top"><div class="toolbar"><button class="button button--secondary" data-calendar="prev">←</button><button class="button button--secondary" data-calendar="today">Today</button><button class="button button--secondary" data-calendar="next">→</button></div><h2>${monthName}</h2></div><div class="calendar-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="calendar-weekday">${d}</div>`).join("")}${days}</div><p class="muted small" style="margin:12px 0 0">Select a day to add an event. Select an event to edit it.</p>`)
  + card(`<h2>All upcoming events</h2>${eventList(30)}`);
}
function renderUpdates(){
  const updates=[
    ["New workspace calendar","You can now add, edit, and remove events in your calendar.","Today","New"],
    ["Saved items are available","Save useful resources and find them again in the Saved items tab.","Yesterday","Tip"],
    ["Profile settings","Update your name, email, and profile details from the Profile page.","This week","Guide"]
  ];
  return heading("Updates","Announcements, tips, and workspace changes.")
  + card(`<div class="list">${updates.map((u,i)=>`<article class="list-row"><span class="pill ${i===0?"blue":"green"}">${u[3]}</span><div class="list-row-main"><strong>${u[0]}</strong><small>${u[1]}</small><small>${u[2]}</small></div><button class="button button--secondary" data-dismiss-update="${i}">Mark read</button></article>`).join("")}</div><p class="muted small" id="updatesHint">These sample announcements are local demo content.</p>`);
}
const resourceData=[
  {id:"r1",icon:"📘",title:"Getting started guide",category:"Guide",description:"Learn the basics and set up your workspace."},
  {id:"r2",icon:"⌨️",title:"Keyboard shortcuts",category:"Tip",description:"A quick list of shortcuts to help you work faster."},
  {id:"r3",icon:"🗓️",title:"Planning your week",category:"Guide",description:"Simple ways to organize your calendar and priorities."},
  {id:"r4",icon:"🔒",title:"Account safety",category:"Security",description:"Good practices for keeping your account secure."}
];
function renderResources(){
  return heading("Resources","Guides and useful information for your workspace.")
  + `<div class="toolbar"><input class="input" style="max-width:330px" id="resourceSearch" placeholder="Filter resources..."><span class="muted small">Save resources to keep them handy.</span></div><div class="resource-grid" id="resourceGrid">${resourceData.map(r=>`<article class="resource-card" data-resource="${r.id}"><span class="pill">${r.category}</span><h3>${r.icon} ${r.title}</h3><p>${r.description}</p><button class="button ${data.saved.some(s=>s.id===r.id)?"button--secondary":""}" data-save-resource="${r.id}">${data.saved.some(s=>s.id===r.id)?"★ Saved":"☆ Save item"}</button></article>`).join("")}</div>`;
}
function renderSaved(){
  return heading("Saved items","Your bookmarked guides and useful content.")
  + card(`<div class="toolbar"><span class="muted small">${data.saved.length} saved item(s)</span><span class="spacer"></span><button class="button button--secondary" data-page="resources">Browse resources</button></div>${savedList(100)}`);
}
function renderProfile(){
  return heading("Profile","Manage the information shown in your workspace.")
  + card(`<form id="profileForm"><div class="profile-layout"><div class="profile-preview"><div class="profile-avatar">${esc((data.profile.name||"U").charAt(0).toUpperCase())}</div><strong>${esc(data.profile.name)}</strong><p class="muted small">${esc(data.profile.email)}</p></div><div><div class="field"><label for="profileName">Full name</label><input class="input" id="profileName" name="name" required value="${esc(data.profile.name)}"></div><div class="field"><label for="profileEmail">Email address</label><input class="input" id="profileEmail" name="email" type="email" required value="${esc(data.profile.email)}"></div><div class="field"><label for="profileLocation">Location</label><input class="input" id="profileLocation" name="location" value="${esc(data.profile.location)}"></div><div class="field"><label for="profileBio">About me</label><textarea class="textarea" id="profileBio" name="bio">${esc(data.profile.bio)}</textarea></div><button class="button" type="submit">Save profile</button></div></div></form>`);
}
function renderSettings(){
  return heading("Settings","Customize how your workspace looks and behaves.")
  + card(`<h2>Appearance</h2><div class="setting-row"><div><strong>Dark mode</strong><div class="muted small">Use a darker color scheme for this browser.</div></div><input class="switch" type="checkbox" id="darkMode" ${data.theme==="dark"?"checked":""}></div><div class="setting-row"><div><strong>Notifications</strong><div class="muted small">Show in-app notification messages.</div></div><input class="switch" type="checkbox" id="notificationsToggle" ${data.notifications?"checked":""}></div>`)
  + card(`<h2>Local data</h2><p class="muted">Your demo profile, events, and saved items are stored in this browser only.</p><button class="button button--danger" id="resetData">Reset demo data</button>`);
}
function renderMessages(){
  return heading("Messages","A simple local message-center layout.")
  + `<section class="content-card"><div class="message-layout"><div class="message-list"><button class="message-person active" data-message="welcome"><strong>Workspace team</strong><br><small class="muted">Welcome to your workspace</small></button><button class="message-person" data-message="tips"><strong>Helpful tips</strong><br><small class="muted">A few ways to get started</small></button></div><div class="message-thread" id="messageThread"><p class="eyebrow">Message</p><h2>Welcome to YourBrand</h2><p class="muted">This is your message area. Choose a message from the list to read it. You can connect this UI to a messaging API later.</p></div></div></section>`;
}
function renderHelp(){
  return heading("Help & support","Quick answers for using this workspace.")
  + card(`<h2>Frequently asked questions</h2><details open><summary>Where is my data saved?</summary><p class="muted">This demo saves changes in your browser's local storage. It does not sync between devices.</p></details><hr><details><summary>How do I add a calendar event?</summary><p class="muted">Open Calendar and select Add event, or click any day in the calendar grid.</p></details><hr><details><summary>How do I save a resource?</summary><p class="muted">Open Resources and press Save item. It will appear in Saved items.</p></details><hr><details><summary>Can I use this for real user accounts?</summary><p class="muted">The front end is ready to connect, but authentication and shared storage require a backend.</p></details>`);
}
function renderPage(page){
  currentPage=page;
  const renderers={overview:renderOverview,calendar:renderCalendar,updates:renderUpdates,saved:renderSaved,resources:renderResources,profile:renderProfile,settings:renderSettings,messages:renderMessages,help:renderHelp};
  document.getElementById("pageContent").innerHTML=(renderers[page]||renderOverview)();
  document.querySelectorAll("[data-page]").forEach(el=>el.classList.toggle("is-active",el.classList.contains("sidebar-link")&&el.dataset.page===page));
  document.title=`${page[0].toUpperCase()+page.slice(1)} | YourBrand`;
  document.getElementById("sidebar").classList.remove("open");
  bindPageEvents();
  window.scrollTo({top:0,behavior:"smooth"});
}
function openEventModal(date=todayISO(),eventId=null){
  const event=data.events.find(e=>e.id===eventId);
  document.getElementById("modalEyebrow").textContent=event?"EDIT EVENT":"CALENDAR";
  document.getElementById("modalTitle").textContent=event?"Edit event":"Add calendar event";
  document.getElementById("modalBody").innerHTML=`<div class="field"><label for="eventTitle">Event title</label><input class="input" id="eventTitle" required value="${esc(event?.title||"")}" placeholder="e.g. Project meeting"></div><div class="field"><label for="eventDate">Date</label><input class="input" id="eventDate" type="date" required value="${esc(event?.date||date)}"></div><div class="field"><label for="eventTime">Time</label><input class="input" id="eventTime" type="time" value="${esc(event?.time||"09:00")}"></div><div class="field"><label for="eventNotes">Notes</label><textarea class="textarea" id="eventNotes" placeholder="Optional details">${esc(event?.notes||"")}</textarea></div>${event?`<button type="button" class="button button--danger" id="deleteEvent">Delete event</button>`:""}`;
  const dialog=document.getElementById("appModal");dialog.showModal();
  document.getElementById("modalSave").onclick=(e)=>{
    e.preventDefault();
    const title=document.getElementById("eventTitle").value.trim(),dateValue=document.getElementById("eventDate").value;
    if(!title||!dateValue){toast("Please enter an event title and date.");return;}
    const next={id:event?.id||crypto.randomUUID(),title,date:dateValue,time:document.getElementById("eventTime").value,notes:document.getElementById("eventNotes").value.trim()};
    if(event)data.events=data.events.map(x=>x.id===event.id?next:x);else data.events.push(next);
    persist();dialog.close();renderPage("calendar");toast(event?"Event updated.":"Event added.");
  };
  const del=document.getElementById("deleteEvent");
  if(del)del.onclick=()=>{data.events=data.events.filter(x=>x.id!==event.id);persist();dialog.close();renderPage("calendar");toast("Event deleted.");};
}
function bindPageEvents(){
  document.querySelectorAll("[data-action='add-event']").forEach(b=>b.onclick=()=>openEventModal());
  document.querySelectorAll("[data-calendar-date]").forEach(b=>b.onclick=(e)=>{
    const eventButton=e.target.closest("[data-edit-event]");
    if(eventButton){openEventModal(todayISO(),eventButton.dataset.editEvent);return;}
    openEventModal(b.dataset.calendarDate);
  });
  document.querySelectorAll("[data-edit-event]").forEach(b=>b.onclick=(e)=>{e.stopPropagation();openEventModal(todayISO(),b.dataset.editEvent);});
  document.querySelectorAll("[data-remove-saved]").forEach(b=>b.onclick=()=>{data.saved=data.saved.filter(x=>x.id!==b.dataset.removeSaved);persist();renderPage("saved");toast("Removed from saved items.");});
  document.querySelectorAll("[data-save-resource]").forEach(b=>b.onclick=()=>{
    const r=resourceData.find(x=>x.id===b.dataset.saveResource);const exists=data.saved.some(x=>x.id===r.id);
    data.saved=exists?data.saved.filter(x=>x.id!==r.id):[...data.saved,{id:r.id,title:r.title,description:r.description,category:r.category}];
    persist();renderPage("resources");toast(exists?"Removed from saved items.":"Resource saved.");
  });
  document.querySelectorAll("#pageContent [data-page]").forEach(b=>b.onclick=(e)=>{e.preventDefault();renderPage(b.dataset.page);});
  document.querySelectorAll("[data-calendar]").forEach(b=>b.onclick=()=>{
    if(b.dataset.calendar==="prev")calendarDate.setMonth(calendarDate.getMonth()-1);
    if(b.dataset.calendar==="next")calendarDate.setMonth(calendarDate.getMonth()+1);
    if(b.dataset.calendar==="today")calendarDate=new Date();
    renderPage("calendar");
  });
  document.querySelectorAll("[data-dismiss-update]").forEach(b=>b.onclick=()=>{b.closest(".list-row").remove();toast("Announcement marked as read.");});
  const profileForm=document.getElementById("profileForm");
  if(profileForm)profileForm.onsubmit=e=>{e.preventDefault();const fd=new FormData(profileForm);data.profile={name:fd.get("name").trim(),email:fd.get("email").trim(),location:fd.get("location").trim(),bio:fd.get("bio").trim()};persist();renderPage("profile");toast("Profile saved.");};
  const dark=document.getElementById("darkMode");if(dark)dark.onchange=()=>{data.theme=dark.checked?"dark":"light";persist();applyTheme();toast("Appearance updated.");};
  const notifications=document.getElementById("notificationsToggle");if(notifications)notifications.onchange=()=>{data.notifications=notifications.checked;persist();toast("Notification setting updated.");};
  const reset=document.getElementById("resetData");if(reset)reset.onclick=()=>{if(confirm("Reset all local demo data? This cannot be undone.")){data=structuredClone(defaultData);persist();applyTheme();renderPage("overview");toast("Demo data reset.");}};
  const resourceSearch=document.getElementById("resourceSearch");if(resourceSearch)resourceSearch.oninput=()=>{const q=resourceSearch.value.toLowerCase();document.querySelectorAll("[data-resource]").forEach(el=>el.classList.toggle("hidden",!el.textContent.toLowerCase().includes(q)));};
  document.querySelectorAll("[data-message]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-message]").forEach(x=>x.classList.remove("active"));b.classList.add("active");const tips=b.dataset.message==="tips";document.getElementById("messageThread").innerHTML=`<p class="eyebrow">Message</p><h2>${tips?"Helpful tips":"Welcome to YourBrand"}</h2><p class="muted">${tips?"Try adding a calendar event, saving a resource, and updating your profile to explore the dashboard features.":"Your workspace is ready. Use the navigation to explore your calendar, updates, resources, and personal settings."}</p>`;});
}
function applyTheme(){document.documentElement.dataset.theme=data.theme||"light";}
document.addEventListener("click",e=>{
  const pageLink=e.target.closest("[data-page]");
  if(pageLink){e.preventDefault();renderPage(pageLink.dataset.page);}
});
document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("quickAddButton").onclick=()=>openEventModal();
document.getElementById("backToTop").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
document.getElementById("notificationsButton").onclick=()=>{if(!data.notifications){toast("Notifications are turned off in Settings.");return;}renderPage("updates");};
document.getElementById("signOutButton").onclick=()=>{if(confirm("Sign out and return to the sign-in page?")){localStorage.removeItem("yourbrand-demo-session");window.location.href="01-get-started.html";}};
document.getElementById("globalSearch").addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  const q=e.target.value.trim().toLowerCase();
  const matches=resourceData.filter(r=>(r.title+" "+r.description+" "+r.category).toLowerCase().includes(q));
  if(!q){renderPage("overview");return;}
  renderPage("resources");
  const input=document.getElementById("resourceSearch");input.value=q;input.dispatchEvent(new Event("input"));
  if(!matches.length)toast("No matching resources found. Try another search.");
});
applyTheme();persist();renderPage("overview");
