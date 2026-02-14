import { jsxs, jsx } from 'react/jsx-runtime';
import { S, B, D, T, K, M, w } from './Radio-DNU_UGtN.mjs';
import { usePostHog } from '@posthog/react';
import 'react';
import 'clsx';

const v = function() {
  const t = usePostHog();
  return jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [jsx("h1", { className: "text-3xl font-bold text-neutral-text mb-8", children: "Create Lesson Plan" }), jsxs(S, { children: [jsx(B, { children: jsx(D, { children: "Plan Details" }) }), jsx(T, { children: jsxs("form", { className: "space-y-6", children: [jsx(K, { label: "Title", required: true, children: jsx(M, { placeholder: "e.g., Introduction to Fractions" }) }), jsx(K, { label: "Description", children: jsx(M, { placeholder: "Brief description of this lesson plan" }) }), jsx(K, { label: "Duration (minutes)", children: jsx(M, { type: "number", placeholder: "45" }) }), jsx(K, { label: "Instructions", children: jsx(M, { placeholder: "Step-by-step instructions for the lesson" }) }), jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [jsx(w, { variant: "secondary", onClick: () => {
    t.capture("lesson_plan_draft_saved", { action: "save_draft" });
  }, children: "Save Draft" }), jsx(w, { variant: "primary", onClick: () => {
    t.capture("lesson_plan_published", { action: "publish" });
  }, children: "Publish" })] })] }) })] })] });
};

export { v as component };
//# sourceMappingURL=new-B61wtW-V.mjs.map
