import { jsx, jsxs } from 'react/jsx-runtime';
import { S, B, D, H, w, T } from './Radio-DNU_UGtN.mjs';
import { usePostHog } from '@posthog/react';
import { g } from '../nitro/nitro.mjs';
import 'react';
import 'clsx';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:async_hooks';
import 'vinxi/lib/invariant';
import 'vinxi/lib/path';
import 'node:url';
import '@tanstack/router-core';
import 'tiny-invariant';
import '@tanstack/start-server-core';
import '@tanstack/start-client-core';
import '@tanstack/react-router';
import 'node:stream';
import 'isbot';
import 'react-dom/server';

const j = function() {
  const { planId: a } = g.useParams(), r = usePostHog();
  return jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: jsxs(S, { children: [jsx(B, { children: jsxs("div", { className: "flex items-start justify-between", children: [jsxs("div", { children: [jsx(D, { children: "Lesson Plan" }), jsxs("p", { className: "text-sm text-neutral-textSecondary mt-1", children: ["Plan ID: ", a] })] }), jsxs("div", { className: "flex items-center gap-2", children: [jsx(H, { variant: "info", children: "Draft" }), jsx(w, { variant: "secondary", size: "sm", onClick: () => {
    r.capture("lesson_plan_forked", { plan_id: a });
  }, children: "Fork" })] })] }) }), jsx(T, { children: jsx("p", { className: "text-neutral-textSecondary", children: "Plan details will be loaded from the database once connected." }) })] }) });
};

export { j as component };
//# sourceMappingURL=_planId-Bm54Fdr8.mjs.map
