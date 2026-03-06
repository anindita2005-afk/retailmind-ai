(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,131763,e=>{"use strict";var r=e.i(659990);let s=(...e)=>e.filter((e,r,s)=>!!e&&""!==e.trim()&&s.indexOf(e)===r).join(" ").trim(),a=e=>{let r=e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,s)=>s?s.toUpperCase():r.toLowerCase());return r.charAt(0).toUpperCase()+r.slice(1)};var t={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let i=(0,r.forwardRef)(({color:e="currentColor",size:a=24,strokeWidth:i=2,absoluteStrokeWidth:l,className:n="",children:o,iconNode:d,...c},p)=>(0,r.createElement)("svg",{ref:p,...t,width:a,height:a,stroke:e,strokeWidth:l?24*Number(i)/Number(a):i,className:s("lucide",n),...!o&&!(e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0;return!1})(c)&&{"aria-hidden":"true"},...c},[...d.map(([e,s])=>(0,r.createElement)(e,s)),...Array.isArray(o)?o:[o]])),l=(e,t)=>{let l=(0,r.forwardRef)(({className:l,...n},o)=>(0,r.createElement)(i,{ref:o,iconNode:t,className:s(`lucide-${a(e).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${e}`,l),...n}));return l.displayName=a(e),l};e.s(["default",()=>l],131763)},392120,e=>{"use strict";let r=(0,e.i(131763).default)("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);e.s(["Loader2",()=>r],392120)},490246,e=>{"use strict";let r=(0,e.i(131763).default)("arrow-right",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);e.s(["ArrowRight",()=>r],490246)},832757,e=>{"use strict";let r=(0,e.i(131763).default)("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);e.s(["ShieldCheck",()=>r],832757)},318668,e=>{"use strict";let r=(0,e.i(131763).default)("eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);e.s(["Eye",()=>r],318668)},472745,e=>{"use strict";let r=(0,e.i(131763).default)("eye-off",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);e.s(["EyeOff",()=>r],472745)},494909,e=>{"use strict";e.i(789171);var r=e.i(665408),s=e.i(659990),a=e.i(318668),t=e.i(472745),i=e.i(392120),l=e.i(490246),n=e.i(131763);let o=(0,n.default)("circle-check-big",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]),d=(0,n.default)("message-circle",[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]]);var c=e.i(832757);let p=["Electronics","FMCG / Grocery","Apparel & Fashion","Furniture & Home","Stationery & Office","Food & Beverage","Pharmaceuticals","Auto Parts","Jewellery","Cosmetics & Beauty","Sports & Fitness","Toys & Games","Agriculture","Other"];function g(){let[e,n]=(0,s.useState)(1),[g,h]=(0,s.useState)(!1),[x,u]=(0,s.useState)(!1),[m,f]=(0,s.useState)(""),[b,j]=(0,s.useState)(!1),[y,w]=(0,s.useState)(!1),[v,N]=(0,s.useState)(!1),[k,C]=(0,s.useState)({full_name:"",email:"",gst_number:"",business_category:"",password:"",business_name:"",business_reg_number:"",pan_number:"",city:"",state:"",phone:""}),A=e=>r=>C(s=>({...s,[e]:r.target.value}));async function S(e){if(e.preventDefault(),!k.city.trim())return void f("City is required.");f(""),u(!0);try{let e=await fetch("https://0ccvfnasqd.execute-api.us-east-1.amazonaws.com/Prod/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:k.email,password:k.password,business_name:k.business_name,gst_number:k.gst_number.toUpperCase(),business_reg_number:k.business_reg_number,pan_number:k.pan_number?.toUpperCase()||null,owner_name:k.full_name,phone:k.phone||null})}),r=await e.json();e.ok?window.location.href="/dashboard":f(r.error||"Registration failed. Please try again.")}catch{f("Network error. Please try again.")}finally{u(!1)}}let z=1===e?33:2===e?66:100;return(0,r.jsxs)("div",{className:"reg-root",children:[(0,r.jsxs)("div",{className:"reg-left",children:[(0,r.jsx)("div",{className:"reg-left-logo",children:(0,r.jsx)("div",{className:"reg-logo-wrap",children:(0,r.jsx)("img",{src:"/image copy.png",alt:"RetailMind AI",className:"reg-logo-img"})})}),(0,r.jsxs)("div",{className:"reg-left-hero",children:[(0,r.jsxs)("h1",{children:["AI Infrastructure",(0,r.jsx)("br",{}),(0,r.jsx)("span",{className:"reg-left-blue",children:"for SMEs."})]}),(0,r.jsx)("p",{children:"Empowering small and medium enterprises with enterprise-grade intelligence to scale operations, predict demand, and optimize margins."})]}),(0,r.jsx)("div",{className:"reg-left-features",children:["Advanced Inventory Analytics","AI-Powered Demand Forecasting","Seamless GST Compliance Integration"].map(e=>(0,r.jsxs)("div",{className:"reg-left-feature",children:[(0,r.jsx)(o,{className:"reg-feature-icon"}),(0,r.jsx)("span",{children:e})]},e))}),(0,r.jsxs)("div",{className:"reg-left-trust",children:[(0,r.jsx)("p",{className:"reg-trust-label",children:"Trusted by businesses using"}),(0,r.jsxs)("div",{className:"reg-trust-logos",children:[(0,r.jsx)("span",{className:"reg-trust-logo",children:"GoFr"}),(0,r.jsx)("span",{className:"reg-trust-logo",children:"Safoe"})]})]}),(0,r.jsx)("div",{className:"reg-left-footer",children:"© 2024 RetailMind AI Technologies Inc."})]}),(0,r.jsxs)("div",{className:"reg-right",children:[(0,r.jsxs)("div",{className:"reg-right-topnav",children:[(0,r.jsx)("span",{children:"Already have an account?"}),(0,r.jsx)("a",{href:"/login",className:"reg-login-btn",children:"Login"})]}),(0,r.jsxs)("div",{className:"reg-right-body",children:[(0,r.jsxs)("div",{className:"reg-step-tracker",children:[(0,r.jsxs)("div",{className:"reg-step-info",children:[(0,r.jsxs)("span",{className:"reg-step-label",children:["STEP ",e," OF 3: ",(0,r.jsx)("strong",{children:1===e?"BUSINESS IDENTITY":2===e?"BUSINESS DETAILS":"LOCATION & CONTACT"})]}),(0,r.jsxs)("span",{className:"reg-step-pct",children:[z,"% Completed"]})]}),(0,r.jsx)("div",{className:"reg-step-bar",children:(0,r.jsx)("div",{className:"reg-step-bar-fill",style:{width:`${z}%`}})})]}),(0,r.jsxs)("div",{className:"reg-heading",children:[(0,r.jsx)("h2",{children:"Create your business account"}),(0,r.jsx)("p",{children:"Fill in the details below to start your AI-powered retail journey."})]}),m&&(0,r.jsx)("div",{className:"reg-error",children:m}),1===e&&(0,r.jsxs)("div",{className:"reg-form-body",children:[(0,r.jsxs)("div",{className:"reg-row-2",children:[(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsx)("label",{htmlFor:"reg-fullname",children:"Full Name"}),(0,r.jsx)("input",{id:"reg-fullname",type:"text",placeholder:"John Doe",value:k.full_name,onChange:A("full_name")})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsx)("label",{htmlFor:"reg-email",children:"Email Address"}),(0,r.jsx)("input",{id:"reg-email",type:"email",placeholder:"john@business.com",value:k.email,onChange:A("email")})]})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsxs)("label",{htmlFor:"reg-gst",children:["GST Number ",(0,r.jsx)("span",{className:"reg-label-required",children:"*Required for Tax Invoicing"})]}),(0,r.jsxs)("div",{className:"reg-gst-row",children:[(0,r.jsx)("input",{id:"reg-gst",type:"text",placeholder:"22AAAAA0000A1Z5",value:k.gst_number,onChange:e=>{A("gst_number")(e),j(!1)},maxLength:15,className:b?"gst-valid":""}),(0,r.jsx)("button",{type:"button",className:`reg-validate-btn ${b?"validated":""}`,onClick:function(){k.gst_number.trim()?(w(!0),f(""),setTimeout(()=>{var e;(w(!1),e=k.gst_number,/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(e.toUpperCase()))?j(!0):(f("Invalid GST format. Example: 22AAAAA0000A1Z5"),j(!1))},800)):f("Please enter a GST number first.")},disabled:y||b,children:y?(0,r.jsx)(i.Loader2,{size:13,className:"spin"}):b?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(o,{size:13})," Verified"]}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(c.ShieldCheck,{size:13})," Validate"]})})]}),(0,r.jsx)("p",{className:"reg-field-hint",children:"Validation ensures immediate access to your merchant dashboard."})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsx)("label",{htmlFor:"reg-category",children:"Business Category"}),(0,r.jsxs)("div",{className:"reg-select-wrap",children:[(0,r.jsxs)("select",{id:"reg-category",value:k.business_category,onChange:A("business_category"),children:[(0,r.jsx)("option",{value:"",children:"Select your industry"}),p.map(e=>(0,r.jsx)("option",{value:e,children:e},e))]}),(0,r.jsx)("svg",{className:"reg-select-icon",viewBox:"0 0 20 20",fill:"currentColor",children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z",clipRule:"evenodd"})})]})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsx)("label",{htmlFor:"reg-password",children:"Create Password"}),(0,r.jsxs)("div",{className:"reg-pass-wrap",children:[(0,r.jsx)("input",{id:"reg-password",type:g?"text":"password",placeholder:"••••••••",value:k.password,onChange:A("password"),autoComplete:"new-password"}),(0,r.jsx)("button",{type:"button",className:"reg-eye",onClick:()=>h(!g),"aria-label":g?"Hide password":"Show password",children:g?(0,r.jsx)(t.EyeOff,{size:15}):(0,r.jsx)(a.Eye,{size:15})})]})]}),(0,r.jsxs)("label",{className:"reg-terms",children:[(0,r.jsx)("input",{type:"checkbox",checked:v,onChange:e=>N(e.target.checked)}),(0,r.jsxs)("span",{children:["I agree to the ",(0,r.jsx)("a",{href:"#",children:"Terms of Service"})," and ",(0,r.jsx)("a",{href:"#",children:"Privacy Policy"}),". I understand RetailMind AI will process my business data to provide analytics."]})]}),(0,r.jsxs)("button",{type:"button",className:"reg-cta",onClick:function(){k.full_name.trim()?k.email.trim()?k.gst_number.trim()?b?k.business_category?!k.password||k.password.length<8?f("Password must be at least 8 characters."):v?(f(""),n(2)):f("You must agree to the Terms of Service."):f("Please select a business category."):f("Please validate your GST number first."):f("GST number is required."):f("Email address is required."):f("Full name is required.")},children:["Continue to Step 2 ",(0,r.jsx)(l.ArrowRight,{size:16})]}),(0,r.jsxs)("div",{className:"reg-help",children:[(0,r.jsx)(d,{size:16,className:"reg-help-icon"}),(0,r.jsxs)("div",{children:[(0,r.jsx)("span",{className:"reg-help-title",children:"Need help setting up?"}),(0,r.jsxs)("span",{className:"reg-help-sub",children:["Our SME support team is available 24/7. ",(0,r.jsx)("a",{href:"#",children:"Chat now"})]})]})]})]}),2===e&&(0,r.jsxs)("div",{className:"reg-form-body",children:[(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsxs)("label",{htmlFor:"reg-bname",children:["Business / Trade Name ",(0,r.jsx)("span",{className:"reg-req",children:"*"})]}),(0,r.jsx)("input",{id:"reg-bname",type:"text",placeholder:"Acme Retail Pvt. Ltd.",value:k.business_name,onChange:A("business_name")})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsxs)("label",{htmlFor:"reg-breg",children:["Business Registration No. ",(0,r.jsx)("span",{className:"reg-req",children:"*"})]}),(0,r.jsx)("input",{id:"reg-breg",type:"text",placeholder:"CIN / MSME / Shop Act No.",value:k.business_reg_number,onChange:A("business_reg_number")})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsxs)("label",{htmlFor:"reg-pan",children:["PAN Card Number ",(0,r.jsx)("span",{className:"reg-optional",children:"(optional)"})]}),(0,r.jsx)("input",{id:"reg-pan",type:"text",placeholder:"ABCDE1234F",value:k.pan_number,onChange:A("pan_number"),maxLength:10})]}),(0,r.jsxs)("div",{className:"reg-row-btns",children:[(0,r.jsx)("button",{type:"button",className:"reg-back-btn",onClick:()=>{n(1),f("")},children:"← Back"}),(0,r.jsxs)("button",{type:"button",className:"reg-cta reg-cta-flex",onClick:function(){k.business_name.trim()?k.business_reg_number.trim()?(f(""),n(3)):f("Business registration number is required."):f("Business name is required.")},children:["Continue to Step 3 ",(0,r.jsx)(l.ArrowRight,{size:16})]})]}),(0,r.jsxs)("div",{className:"reg-help",children:[(0,r.jsx)(d,{size:16,className:"reg-help-icon"}),(0,r.jsxs)("div",{children:[(0,r.jsx)("span",{className:"reg-help-title",children:"Need help setting up?"}),(0,r.jsxs)("span",{className:"reg-help-sub",children:["Our SME support team is available 24/7. ",(0,r.jsx)("a",{href:"#",children:"Chat now"})]})]})]})]}),3===e&&(0,r.jsxs)("form",{className:"reg-form-body",onSubmit:S,children:[(0,r.jsxs)("div",{className:"reg-row-2",children:[(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsxs)("label",{htmlFor:"reg-city",children:["City ",(0,r.jsx)("span",{className:"reg-req",children:"*"})]}),(0,r.jsx)("input",{id:"reg-city",type:"text",placeholder:"Mumbai",value:k.city,onChange:A("city")})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsx)("label",{htmlFor:"reg-state",children:"State"}),(0,r.jsx)("input",{id:"reg-state",type:"text",placeholder:"Maharashtra",value:k.state,onChange:A("state")})]})]}),(0,r.jsxs)("div",{className:"reg-field",children:[(0,r.jsx)("label",{htmlFor:"reg-phone",children:"Phone Number"}),(0,r.jsx)("input",{id:"reg-phone",type:"tel",placeholder:"+91 98765 43210",value:k.phone,onChange:A("phone")})]}),(0,r.jsxs)("div",{className:"reg-row-btns",children:[(0,r.jsx)("button",{type:"button",className:"reg-back-btn",onClick:()=>{n(2),f("")},children:"← Back"}),(0,r.jsxs)("button",{type:"submit",className:"reg-cta reg-cta-flex",disabled:x,children:[x?(0,r.jsx)(i.Loader2,{size:16,className:"spin"}):null,x?"Creating Account…":(0,r.jsxs)(r.Fragment,{children:["Create Account ",(0,r.jsx)(l.ArrowRight,{size:16})]})]})]}),(0,r.jsxs)("div",{className:"reg-help",children:[(0,r.jsx)(d,{size:16,className:"reg-help-icon"}),(0,r.jsxs)("div",{children:[(0,r.jsx)("span",{className:"reg-help-title",children:"Need help setting up?"}),(0,r.jsxs)("span",{className:"reg-help-sub",children:["Our SME support team is available 24/7. ",(0,r.jsx)("a",{href:"#",children:"Chat now"})]})]})]})]})]})]}),(0,r.jsx)("style",{children:`
        /* ── Root ── */
        .reg-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f1923;
        }

        /* ── Left Panel ── */
        .reg-left {
          width: 340px;
          flex-shrink: 0;
          background: #111820;
          display: flex;
          flex-direction: column;
          padding: 40px 36px;
          border-right: 1px solid #1e2d3d;
          position: relative;
          overflow: hidden;
        }

        /* subtle grid bg */
        .reg-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .reg-left > * { position: relative; z-index: 1; }

        .reg-left-logo {
          margin-bottom: 32px;
        }
        .reg-logo-wrap {
          display: inline-block;
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(20,60,35,0.90) 0%, rgba(10,35,20,0.95) 100%);
          border: 0.5px solid rgba(71,255,134,0.10);
          box-shadow:
            0 0 18px rgba(71,255,134,0.16),
            0 0 45px rgba(71,255,134,0.05),
            inset 0 0 18px rgba(71,255,134,0.05);
          padding: 3px;
        }
        .reg-logo-img {
          height: 68px;
          width: auto;
          object-fit: contain;
          border-radius: 8px;
          display: block;
          filter:
            drop-shadow(0 0 8px rgba(71,255,134,0.40))
            drop-shadow(0 2px 6px rgba(0,0,0,0.5));
        }

        .reg-left-hero {
          margin-bottom: 32px;
        }
        .reg-left-hero h1 {
          font-size: 30px;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 12px 0;
        }
        .reg-left-blue { color: #47ff86; }
        .reg-left-hero p {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          margin: 0;
        }

        .reg-left-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 40px;
        }
        .reg-left-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
        }
        .reg-feature-icon {
          width: 16px;
          height: 16px;
          color: #47ff86;
          flex-shrink: 0;
        }

        .reg-left-trust {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .reg-trust-label {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .reg-trust-logos {
          display: flex;
          gap: 12px;
        }
        .reg-trust-logo {
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.02em;
        }

        .reg-left-footer {
          margin-top: 20px;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
        }

        /* ── Right Panel ── */
        .reg-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #111820;
          overflow-y: auto;
        }

        .reg-right-topnav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          padding: 20px 48px;
          font-size: 13px;
          color: #64748b;
          border-bottom: 1px solid #1e2d3d;
          flex-shrink: 0;
        }
        .reg-login-btn {
          padding: 7px 20px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.15);
          background: transparent;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .reg-login-btn:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04);
        }

        .reg-right-body {
          flex: 1;
          max-width: 560px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 48px 60px;
        }

        /* Step tracker */
        .reg-step-tracker { margin-bottom: 28px; }
        .reg-step-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .reg-step-label {
          font-size: 11px;
          color: #47ff86;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .reg-step-label strong { color: #47ff86; font-weight: 700; }
        .reg-step-pct { font-size: 12px; color: #64748b; }
        .reg-step-bar {
          height: 3px;
          border-radius: 99px;
          background: rgba(255,255,255,0.07);
          overflow: hidden;
        }
        .reg-step-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: #47ff86;
          transition: width 0.4s ease;
        }

        /* Heading */
        .reg-heading { margin-bottom: 28px; }
        .reg-heading h2 {
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 6px 0;
        }
        .reg-heading p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        /* Error */
        .reg-error {
          padding: 11px 14px;
          border-radius: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
          font-size: 13px;
          margin-bottom: 18px;
        }

        /* Form body */
        .reg-form-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Row of 2 */
        .reg-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* Field */
        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .reg-field label {
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .reg-label-required {
          font-size: 11px;
          font-weight: 600;
          color: #f87171;
        }
        .reg-req { color: #f87171; }
        .reg-optional { font-size: 11px; color: #64748b; font-weight: 400; }

        .reg-field input,
        .reg-field select {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid #1e293b;
          background: #1a2332;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .reg-field input::placeholder { color: #334155; }
        .reg-field input:focus,
        .reg-field select:focus {
          border-color: #47ff86;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .reg-field input.gst-valid {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }
        .reg-field-hint {
          font-size: 11px;
          color: #475569;
          margin: 0;
        }

        /* GST row */
        .reg-gst-row {
          display: flex;
          gap: 10px;
        }
        .reg-gst-row input {
          flex: 1;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: 0.05em;
        }
        .reg-validate-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          border-radius: 8px;
          border: none;
          background: #188356ff;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, opacity 0.15s;
          flex-shrink: 0;
        }
        .reg-validate-btn:hover:not(:disabled) { background: rgb(21, 77, 54); }
        .reg-validate-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .reg-validate-btn.validated { background: #16a34a; }

        /* Select */
        .reg-select-wrap {
          position: relative;
        }
        .reg-select-wrap select {
          appearance: none;
          -webkit-appearance: none;
          padding-right: 36px;
          cursor: pointer;
        }
        .reg-select-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #475569;
          pointer-events: none;
        }

        /* Password wrap */
        .reg-pass-wrap {
          position: relative;
        }
        .reg-pass-wrap input { padding-right: 44px; }
        .reg-eye {
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
        .reg-eye:hover { color: #94a3b8; }

        /* Terms */
        .reg-terms {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .reg-terms input[type="checkbox"] {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          border: 1px solid #334155;
          background: #1a2332;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
          accent-color: #47ff86;
        }
        .reg-terms span {
          font-size: 12px;
          color: rgb(255, 255, 255);
          line-height: 1.55;
        }
        .reg-terms a {
          color: #47ff86;
          text-decoration: none;
        }
        .reg-terms a:hover { color: rgb(21, 77, 54); }

        /* CTA Button */
        .reg-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          border-radius: 8px;
          border: none;
          background: #188356ff;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .reg-cta:hover:not(:disabled) {
          background: rgb(21, 77, 54);
          box-shadow: 0 8px 24px rgb(36, 61, 51);
          transform: translateY(-1px);
        }
        .reg-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .reg-cta-flex { flex: 1; }

        /* Back + CTA row */
        .reg-row-btns {
          display: flex;
          gap: 10px;
        }
        .reg-back-btn {
          padding: 14px 20px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .reg-back-btn:hover {
          border-color: rgba(255,255,255,0.25);
          color: #e2e8f0;
        }

        /* Help banner */
        .reg-help {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(59,130,246,0.06);
          border: 1px solid rgba(59,130,246,0.15);
        }
        .reg-help-icon {
          color: #47ff86;
          flex-shrink: 0;
          margin-top: 2px;
          width: 16px;
          height: 16px;
        }
        .reg-help div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .reg-help-title {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .reg-help-sub {
          font-size: 12px;
          color: #64748b;
        }
        .reg-help-sub a {
          color: #47ff86;
          text-decoration: none;
          font-weight: 500;
        }
        .reg-help-sub a:hover { color: rgb(21, 77, 54); }

        /* Spin */
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 768px) {
          .reg-root { flex-direction: column; }
          .reg-left {
            width: 100%;
            padding: 28px 24px;
          }
          .reg-left-trust, .reg-left-footer { display: none; }
          .reg-right-body { padding: 28px 20px 48px; }
          .reg-right-topnav { padding: 16px 20px; }
          .reg-row-2 { grid-template-columns: 1fr; }
        }
      `})]})}e.s(["default",()=>g],494909)},140687,e=>{e.n(e.i(494909))}]);