import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

function l({ src: s, alt: r }) {
  return jsx("div", { className: "bg-neutral-surface rounded-3xl shadow-xl border border-neutral-border p-2 max-w-[280px] mx-auto", children: jsx("img", { src: s, alt: r, className: "rounded-2xl w-full", loading: "lazy" }) });
}
function p() {
  return jsx("section", { className: "bg-student-purple-50 py-10 sm:py-16", children: jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-8 lg:gap-12", children: [jsxs("div", { className: "flex-1 text-center lg:text-left", children: [jsxs("h1", { className: "text-4xl sm:text-5xl font-bold text-neutral-text mb-4", children: ["Track your homeschool days", jsx("span", { className: "block text-student-purple-700", children: "without the paperwork" })] }), jsx("p", { className: "text-lg text-neutral-textSecondary mb-4 max-w-xl", children: "Log activities, track progress, and stay organized \u2014 so you can spend more time teaching and less time record-keeping." }), jsx(m, {}), jsx(x, {})] }), jsx("div", { className: "flex-shrink-0", children: jsx(l, { src: "/screenshots/01-today.webp", alt: "Homeschool app dashboard showing daily activities, upcoming events, and milestone progress" }) })] }) }) });
}
function m() {
  return jsxs("div", { className: "mb-5 inline-flex items-center gap-2 bg-neutral-surface border border-neutral-border rounded-lg px-4 py-2 text-sm", children: [jsx("span", { className: "font-semibold text-student-purple-700", children: "NEVCON 2026" }), jsx("span", { className: "text-neutral-textSecondary", children: "March 5-7 in Las Vegas" })] });
}
function x() {
  return jsxs("div", { className: "space-y-3", children: [jsx("p", { className: "text-sm font-semibold text-student-purple-700", children: "Coming Soon" }), jsxs("div", { className: "flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-textSecondary", children: [jsx("span", { children: "macOS: Apple Silicon | Intel" }), jsx("span", { children: "Windows: Intel | Arm" }), jsx("span", { children: "Linux: Intel | Arm" })] }), jsxs("div", { className: "flex gap-x-6 text-sm text-neutral-textSecondary", children: [jsx("span", { children: "App Store" }), jsx("span", { children: "Google Play" })] })] });
}
function a({ title: s, description: r, screenshot: o, alt: i, reverse: c }) {
  return jsxs("div", { className: `flex flex-col ${c ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-12`, children: [jsxs("div", { className: "flex-1", children: [jsx("h3", { className: "text-2xl font-bold text-neutral-text mb-3", children: s }), jsx("p", { className: "text-neutral-textSecondary text-lg leading-relaxed", children: r })] }), jsx("div", { className: "flex-shrink-0", children: jsx(l, { src: o, alt: i }) })] });
}
function n({ bg: s, children: r }) {
  return jsx("section", { className: `${s} py-10 sm:py-14`, children: jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: r }) });
}
function h() {
  return jsxs(Fragment, { children: [jsx(n, { bg: "bg-neutral-surface", children: jsx(a, { title: "Log activities in seconds", description: "Tap to log worksheets, videos, reading, writing, and hands-on work. Quick Repeat lets you re-log yesterday's favorites with one tap. Track both kids at once.", screenshot: "/screenshots/02-log.webp", alt: "Activity logging screen with quick-repeat cards and student tabs", reverse: true }) }), jsx(n, { bg: "bg-neutral-backgroundDeep", children: jsx(a, { title: "See their progress at a glance", description: "Weekly wins show what you accomplished. Subject breakdowns and milestone progress bars help you see where things stand without digging through records.", screenshot: "/screenshots/03-progress.webp", alt: "Progress screen showing weekly wins, milestone progress, and subject breakdown", reverse: false }) }), jsx(n, { bg: "bg-neutral-surface", children: jsx(a, { title: "Track their reading journey", description: "Keep a running library of everything they read. Track page progress, mark grade levels, and search or filter to find any book.", screenshot: "/screenshots/04-library.webp", alt: "Book library with reading progress bars, search, and filters", reverse: true }) }), jsx(n, { bg: "bg-neutral-backgroundDeep", children: jsx(a, { title: "Set goals and celebrate wins", description: "Define milestones with star ratings and target dates. Watch status badges update as your kids work toward their goals.", screenshot: "/screenshots/05-milestones.webp", alt: "Milestones list with star ratings, status badges, and descriptions", reverse: false }) })] });
}
function g() {
  return jsx("section", { className: "bg-student-purple-50 py-10 sm:py-14", children: jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center", children: [jsx("h2", { className: "text-3xl font-bold text-neutral-text mb-2", children: "Come see us at NEVCON 2026" }), jsx("p", { className: "text-lg text-neutral-textSecondary mb-2", children: "March 5-7, 2026 at Sam's Town Hotel, Las Vegas" }), jsx("p", { className: "text-neutral-textSecondary mb-5 max-w-xl mx-auto", children: "We're a Nevada homeschool family building the tool we wished we had. Stop by and say hi \u2014 we'd love to show you the app in person." }), jsx("a", { href: "https://nevcon.org", target: "_blank", rel: "noopener noreferrer", className: "inline-block bg-student-purple-600 text-neutral-textInverse font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity", children: "Visit nevcon.org" })] }) });
}
const u = ["Track daily activities by subject", "Log worksheets, videos, reading, writing, and hands-on work", "Monitor progress across subjects and kids", "Set and track learning milestones", "Keep a reading library with page-level progress", "Works offline, syncs across devices"];
function b() {
  return jsxs("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14", children: [jsx("h2", { className: "text-2xl font-bold text-neutral-text mb-6 text-center", children: "What you can do" }), jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 max-w-4xl mx-auto", children: u.map((s) => jsxs("div", { className: "flex items-start gap-2", children: [jsx("span", { className: "text-student-purple-700 mt-0.5 font-bold", children: "+" }), jsx("span", { className: "text-neutral-textSecondary", children: s })] }, s)) })] });
}
const y = function() {
  return jsxs("div", { children: [jsx(p, {}), jsx(h, {}), jsx(g, {}), jsx(b, {})] });
};

export { y as component };
//# sourceMappingURL=index-Crag6g7Y.mjs.map
