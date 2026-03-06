(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,131763,e=>{"use strict";var i=e.i(659990);let o=(...e)=>e.filter((e,i,o)=>!!e&&""!==e.trim()&&o.indexOf(e)===i).join(" ").trim(),r=e=>{let i=e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,i,o)=>o?o.toUpperCase():i.toLowerCase());return i.charAt(0).toUpperCase()+i.slice(1)};var t={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let a=(0,i.forwardRef)(({color:e="currentColor",size:r=24,strokeWidth:a=2,absoluteStrokeWidth:n,className:l="",children:s,iconNode:d,...g},c)=>(0,i.createElement)("svg",{ref:c,...t,width:r,height:r,stroke:e,strokeWidth:n?24*Number(a)/Number(r):a,className:o("lucide",l),...!s&&!(e=>{for(let i in e)if(i.startsWith("aria-")||"role"===i||"title"===i)return!0;return!1})(g)&&{"aria-hidden":"true"},...g},[...d.map(([e,o])=>(0,i.createElement)(e,o)),...Array.isArray(s)?s:[s]])),n=(e,t)=>{let n=(0,i.forwardRef)(({className:n,...l},s)=>(0,i.createElement)(a,{ref:s,iconNode:t,className:o(`lucide-${r(e).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${e}`,n),...l}));return n.displayName=r(e),n};e.s(["default",()=>n],131763)},392120,e=>{"use strict";let i=(0,e.i(131763).default)("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);e.s(["Loader2",()=>i],392120)},490246,e=>{"use strict";let i=(0,e.i(131763).default)("arrow-right",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);e.s(["ArrowRight",()=>i],490246)},318668,e=>{"use strict";let i=(0,e.i(131763).default)("eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);e.s(["Eye",()=>i],318668)},472745,e=>{"use strict";let i=(0,e.i(131763).default)("eye-off",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);e.s(["EyeOff",()=>i],472745)},163041,e=>{"use strict";var i=e.i(665408),o=e.i(659990),r=e.i(318668),t=e.i(472745),a=e.i(490246),n=e.i(392120);function l(){let[e,l]=(0,o.useState)(""),[s,d]=(0,o.useState)(""),[g,c]=(0,o.useState)(!1),[p,h]=(0,o.useState)(!1),[x,f]=(0,o.useState)(!1),[m,u]=(0,o.useState)(""),[b,y]=(0,o.useState)(!1),[w,j]=(0,o.useState)(""),[v,k]=(0,o.useState)("");async function N(i){i.preventDefault(),u(""),f(!0);try{if(b){let i=await fetch("https://0ccvfnasqd.execute-api.us-east-1.amazonaws.com/Prod/api/auth/login?step=confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e,otp:w,otpToken:v})}),o=await i.json();i.ok?window.location.href="/dashboard":u(o.error||"OTP Verification failed")}else{let i=await fetch("https://0ccvfnasqd.execute-api.us-east-1.amazonaws.com/Prod/api/auth/login?step=verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e,password:s})}),o=await i.json();i.ok?(k(o.otpToken),y(!0)):u(o.error||"Login failed")}}catch{u("Network error. Please try again.")}finally{f(!1)}}return(0,i.jsxs)("div",{className:"login-root",children:[(0,i.jsxs)("div",{className:"login-left",children:[(0,i.jsx)("div",{className:"login-logo",children:(0,i.jsx)("div",{className:"login-logo-wrap",children:(0,i.jsx)("img",{src:"/image copy.png",alt:"RetailMind AI",className:"login-logo-img"})})}),(0,i.jsxs)("div",{className:"login-heading",children:[(0,i.jsx)("h1",{children:"Welcome Back"}),(0,i.jsx)("p",{children:"Enter your credentials to access your retail analytics dashboard"})]}),m&&(0,i.jsx)("div",{className:"login-error",children:m}),(0,i.jsxs)("form",{onSubmit:N,className:"login-form",children:[b?(0,i.jsxs)("div",{className:"login-field",children:[(0,i.jsx)("label",{htmlFor:"login-otp",children:"Verify Email OTP"}),(0,i.jsx)("input",{id:"login-otp",type:"text",value:w,onChange:e=>j(e.target.value),placeholder:"Enter 6-digit OTP",required:!0,autoComplete:"one-time-code",maxLength:6,style:{textAlign:"center",letterSpacing:"4px",fontSize:"18px",fontWeight:"bold"}}),(0,i.jsx)("p",{style:{fontSize:"12px",color:"rgba(255,255,255,0.5)",marginTop:"4px"},children:"An OTP has been sent to your email. Please enter it here."})]}):(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"login-field",children:[(0,i.jsx)("label",{htmlFor:"login-email",children:"Email Address"}),(0,i.jsx)("input",{id:"login-email",type:"email",value:e,onChange:e=>l(e.target.value),placeholder:"name@company.com",required:!0,autoComplete:"email"})]}),(0,i.jsxs)("div",{className:"login-field",children:[(0,i.jsxs)("div",{className:"login-field-header",children:[(0,i.jsx)("label",{htmlFor:"login-password",children:"Password"}),(0,i.jsx)("a",{href:"#",className:"login-forgot",children:"Forgot password?"})]}),(0,i.jsxs)("div",{className:"login-password-wrap",children:[(0,i.jsx)("input",{id:"login-password",type:g?"text":"password",value:s,onChange:e=>d(e.target.value),placeholder:"••••••••",required:!0,autoComplete:"current-password"}),(0,i.jsx)("button",{type:"button",className:"login-eye",onClick:()=>c(!g),"aria-label":g?"Hide password":"Show password",children:g?(0,i.jsx)(t.EyeOff,{size:16}):(0,i.jsx)(r.Eye,{size:16})})]})]}),(0,i.jsxs)("label",{className:"login-remember",children:[(0,i.jsx)("input",{type:"checkbox",checked:p,onChange:e=>h(e.target.checked)}),(0,i.jsx)("span",{children:"Keep me logged in"})]})]}),(0,i.jsx)("button",{type:"submit",disabled:x,className:"login-btn",children:x?(0,i.jsx)(n.Loader2,{size:16,className:"spin"}):(0,i.jsxs)(i.Fragment,{children:[b?"Verify OTP":"Sign In & Get OTP"," ",(0,i.jsx)(a.ArrowRight,{size:16})]})})]}),(0,i.jsxs)("p",{className:"login-footer",children:["Don't have an account? ",(0,i.jsx)("a",{href:"/register",children:"Create account"})]})]}),(0,i.jsxs)("div",{className:"login-right",id:"login-hero-panel",children:[(0,i.jsx)("div",{className:"login-right-bg"}),(0,i.jsx)("div",{className:"login-right-overlay"}),(0,i.jsxs)("div",{className:"login-hero-content",children:[(0,i.jsx)("div",{className:"login-hero-badge",children:"NEW FEATURE AVAILABLE"}),(0,i.jsxs)("h2",{className:"login-hero-title",children:["Predictive",(0,i.jsx)("br",{}),"Inventory",(0,i.jsx)("br",{}),(0,i.jsxs)("span",{className:"login-hero-highlight",children:["at your",(0,i.jsx)("br",{}),"fingertips."]})]}),(0,i.jsx)("p",{className:"login-hero-desc",children:"Harness the power of neural networks to optimize your supply chain and maximize retail performance in real-time."}),(0,i.jsx)("div",{className:"login-hero-divider"}),(0,i.jsxs)("div",{className:"login-hero-stats",children:[(0,i.jsxs)("div",{className:"login-stat",children:[(0,i.jsx)("span",{className:"login-stat-value",children:"24%"}),(0,i.jsx)("span",{className:"login-stat-label",children:"Average ROI increase"})]}),(0,i.jsxs)("div",{className:"login-stat",children:[(0,i.jsx)("span",{className:"login-stat-value",children:"12k+"}),(0,i.jsx)("span",{className:"login-stat-label",children:"Stores optimized daily"})]})]})]})]}),(0,i.jsx)("style",{children:`
        /* ── Root ── */
        .login-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f1923;
        }

        /* ── Left Panel ── */
        .login-left {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 72px;
          background: #111820;
          flex-shrink: 0;
        }

        /* Logo */
        .login-logo {
          margin-bottom: 32px;
        }
        .login-logo-wrap {
          display: inline-block;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(20,60,35,0.90) 0%, rgba(10,35,20,0.95) 100%);
          border: 0.5px solid rgba(71,255,134,0.10);
          box-shadow:
            0 0 20px rgba(71,255,134,0.18),
            0 0 50px rgba(71,255,134,0.06),
            inset 0 0 20px rgba(71,255,134,0.06);
          padding: 3px;
        }
        .login-logo-img {
          height: 76px;
          width: auto;
          object-fit: contain;
          border-radius: 10px;
          display: block;
          filter:
            drop-shadow(0 0 10px rgba(71,255,134,0.45))
            drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        }

        /* Heading */
        .login-heading { margin-bottom: 32px; }
        .login-heading h1 {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
          line-height: 1.1;
        }
        .login-heading p {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.5;
        }

        /* Error */
        .login-error {
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .login-field label {
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
        }
        .login-field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .login-forgot {
          font-size: 13px;
          color: #47ff86;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .login-forgot:hover { color: #2a9e53ff; }

        .login-field input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 8px;
          border: 1px solid #1e293b;
          background: #1a2332;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .login-field input::placeholder { color: #475569; }
        .login-field input:focus {
          border-color: #47ff86;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .login-password-wrap { position: relative; }
        .login-password-wrap input { padding-right: 44px; }
        .login-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #475569;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .login-eye:hover { color: #94a3b8; }

        /* Remember me */
        .login-remember {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .login-remember input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid #334155;
          background: #1a2332;
          cursor: pointer;
          flex-shrink: 0;
          accent-color: #47ff86;
        }
        .login-remember span { font-size: 13px; color: #94a3b8; }

        /* Submit Button */
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          border-radius: 8px;
          border: none;
          background: #188356ff;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          letter-spacing: -0.01em;
          margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) {
          background: #105b3cff;
          box-shadow: 0 8px 24px #3a4e41ff;
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .login-footer {
          margin-top: 28px;
          font-size: 13px;
          color: #fcfdfdff;
          text-align: center;
        }
        .login-footer a {
          color: #47ff86;
          text-decoration: none;
          font-weight: 500;
        }
        .login-footer a:hover { color: #24b375ff; }

        /* ── Right Panel ── */
        .login-right {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 56px 64px;
        }

        /* Actual background image */
        .login-right-bg {
          position: absolute;
          inset: 0;
          background-image: url('/image.png');
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
        }

        /* Dark overlay for text readability */
        .login-right-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0, 5, 15, 0.88) 0%,
            rgba(0, 10, 20, 0.50) 45%,
            rgba(0, 5, 10, 0.15) 100%
          );
          z-index: 1;
        }


        /* Hero Content */
        .login-hero-content {
          position: relative;
          z-index: 3;
          max-width: 420px;
        }

        .login-hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.75);
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .login-hero-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.05;
          color: #ffffff;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
        }
        .login-hero-highlight { color: #47ff86; }

        .login-hero-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
          margin: 0 0 24px 0;
          max-width: 360px;
        }

        .login-hero-divider {
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.12);
          margin-bottom: 24px;
        }

        .login-hero-stats { display: flex; gap: 48px; }
        .login-stat { display: flex; flex-direction: column; gap: 4px; }
        .login-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .login-stat-label { font-size: 12px; color: rgba(255,255,255,0.5); }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .login-right { display: none; }
          .login-left { max-width: 100%; padding: 40px 24px; }
        }
      `})]})}e.s(["default",()=>l])},132374,e=>{e.n(e.i(163041))}]);