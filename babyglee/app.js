(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const PRICE=1290, LIST=1800, WA='8801974974973';
const fmt=n=>'৳'+n.toLocaleString('en-US');

/* Original illustrated sneaker (SVG, drawn from scratch) */
function shoe(c){
  const {body,accent,sole='#fff',lace='#fff'}=c;
  return `<svg viewBox="0 0 400 260" role="img" aria-label="Kids sneaker">
  <ellipse cx="200" cy="246" rx="170" ry="9" fill="rgba(0,0,0,.08)"/>
  <path d="M40 208 C28 150 38 104 68 86 C90 74 120 80 142 94 L170 64 C186 50 206 54 214 68 L234 112 C272 122 332 138 366 170 C384 186 386 200 380 208 Z" fill="${body}"/>
  <path d="M300 130 C336 140 364 158 376 178 C384 192 382 202 380 208 L288 208 C300 182 304 152 300 130Z" fill="${accent}"/>
  <path d="M40 208 C28 150 38 104 68 86 C84 78 98 78 112 82 C98 120 94 164 96 208 Z" fill="${accent}"/>
  <path d="M142 94 L170 64 C186 50 206 54 214 68 L220 84 C202 78 178 86 162 102Z" fill="#fff" opacity=".35"/>
  <path d="M68 86 C90 74 120 80 142 94 L162 102 C130 96 98 92 68 104Z" fill="#000" opacity=".22"/>
  <g stroke="${lace}" stroke-width="8" stroke-linecap="round"><path d="M186 108 L224 124"/><path d="M168 128 L212 144"/><path d="M152 150 L196 164"/></g>
  <path d="M120 150 l5 11 12 1.5-9 8 2.5 12-10.5-6-10.5 6 2.5-12-9-8 12-1.5z" fill="#fff" opacity=".9" transform="translate(0,-6) scale(.9) translate(14,10)"/>
  <path d="M22 202 L384 202 C388 224 368 238 340 238 L64 238 C36 238 18 224 22 202Z" fill="${sole}"/>
  <path d="M22 202 L384 202 L383 212 L23 212Z" fill="#000" opacity=".1"/>
  <g fill="#000" opacity=".14">${[56,96,136,176,216,256,296,336].map(x=>`<rect x="${x}" y="222" width="24" height="8" rx="4"/>`).join('')}</g>
  </svg>`;
}

const PRODUCTS=[
 {id:1,name:'Dark Navy',cat:['boys','unisex'],isNew:false,c:{body:'#24305e',accent:'#24babc'}},
 {id:2,name:'Blue & Beige',cat:['boys','unisex'],isNew:true,c:{body:'#e9dcc3',accent:'#3b82c4'}},
 {id:3,name:'Black',cat:['boys'],isNew:false,c:{body:'#2a2a2a',accent:'#ff7a59'}},
 {id:4,name:'Charcoal Grey',cat:['unisex'],isNew:true,c:{body:'#6b7075',accent:'#ffc83d'}},
 {id:5,name:'Multi Color',cat:['unisex'],isNew:true,c:{body:'#ff7aa8',accent:'#24babc',lace:'#ffc83d'}},
];
const SIZES=[22,23,24,25,26,27,28,29,30,31];

/* state */
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let cart=load('bg_cart',[]), wish=new Set(load('bg_wish',[]));

/* toast */
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}

/* hero shoe */
$('#heroShoe').innerHTML=shoe({body:'#24babc',accent:'#ffc83d'});

/* product grid */
let filter='all';
function renderGrid(){
  const list=PRODUCTS.filter(p=>filter==='all'||(filter==='new'?p.isNew:p.cat.includes(filter)));
  $('#grid').innerHTML=list.map(p=>`
   <article class="pcard tilt" data-id="${p.id}">
     ${p.isNew?'<span class="badge">NEW</span>':'<span class="badge">HOT 🔥</span>'}
     <button class="wish ${wish.has(p.id)?'on':''}" data-wish="${p.id}" aria-label="Wishlist">♥</button>
     <div class="pic" data-open="${p.id}">${shoe(p.c)}</div>
     <h3>${p.name}</h3>
     <p class="sub">Bounce Series BSTD-01 · Kids' Sneakers</p>
     <div class="row"><div class="pr"><s>${fmt(LIST)}</s><b>${fmt(PRICE)}</b></div><button class="add" data-open="${p.id}">Add +</button></div>
   </article>`).join('')||'<p class="empty">Nothing here yet 🎈</p>';
  bindTilt();
}
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;setFilter(b.dataset.f)});
function setFilter(f){filter=f;$$('.chip').forEach(c=>c.classList.toggle('on',c.dataset.f===f));renderGrid()}
$$('.cat').forEach(c=>c.addEventListener('click',()=>setFilter(c.dataset.filter)));
$('#grid').addEventListener('click',e=>{
  const w=e.target.closest('[data-wish]');
  if(w){const id=+w.dataset.wish;wish.has(id)?wish.delete(id):wish.add(id);save('bg_wish',[...wish]);w.classList.toggle('on');counts();toast(wish.has(id)?'Saved to wishlist ♥':'Removed from wishlist');return}
  const o=e.target.closest('[data-open]');if(o)openModal(+o.dataset.open);
});

/* 3D tilt */
function bindTilt(){
  $$('.tilt').forEach(el=>{
    if(el._t)return;el._t=1;
    el.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch')return;
      const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      el.style.transform=`rotateY(${x*16}deg) rotateX(${-y*16}deg) translateY(-6px)`;
    });
    el.addEventListener('pointerleave',()=>el.style.transform='');
  });
}
bindTilt();

/* hero parallax */
const stage=$('#stage'),hs=$('#heroShoe');
stage.parentElement.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  hs.style.transform=`rotateY(${x*30}deg) rotateX(${-y*20}deg)`;
});
stage.parentElement.addEventListener('pointerleave',()=>hs.style.transform='');

/* modal */
let cur=null,curSize=null;
function openModal(id){
  cur=PRODUCTS.find(p=>p.id===id);curSize=null;
  $('#mShoe').innerHTML=shoe(cur.c);$('#mName').textContent='Bounce Series — '+cur.name;
  $('#mTag').textContent=cur.isNew?'New arrival':'Hot selling';
  $('#mSizes').innerHTML=SIZES.map(s=>`<button class="sz" data-s="${s}">${s}</button>`).join('');
  $('#modal').classList.add('on');
}
const closeModal=()=>$('#modal').classList.remove('on');
$('#closeModal').onclick=closeModal;
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
$('#mSizes').addEventListener('click',e=>{const b=e.target.closest('.sz');if(!b)return;curSize=+b.dataset.s;$$('.sz').forEach(x=>x.classList.toggle('on',x===b))});
$('#mAdd').onclick=()=>{
  if(!curSize){toast('Pick a size first 👟');return}
  const k=cur.id+'-'+curSize,ex=cart.find(i=>i.k===k);
  ex?ex.q++:cart.push({k,id:cur.id,size:curSize,q:1});
  save('bg_cart',cart);counts();renderCart();closeModal();openCart();toast('Added to cart 🎉');
};

/* cart */
function counts(){$('#cartCount').textContent=cart.reduce((a,i)=>a+i.q,0);$('#wishCount').textContent=wish.size}
function renderCart(){
  const b=$('#cartBody');
  if(!cart.length){b.innerHTML='<div class="empty"><span>🧸</span>Your cart is waiting for happy feet!</div>';$('#cartTotal').textContent=fmt(0);$('#checkout').style.display='none';return}
  $('#checkout').style.display='';
  b.innerHTML=cart.map(i=>{const p=PRODUCTS.find(x=>x.id===i.id);return `<div class="ci"><div class="t">${shoe(p.c)}</div><div><b>${p.name}</b><small>BSTD-01 · Size EU ${i.size}</small><div class="qty"><button data-d="-1" data-k="${i.k}">−</button><span>${i.q}</span><button data-d="1" data-k="${i.k}">+</button></div></div><b>${fmt(PRICE*i.q)}</b></div>`}).join('');
  const total=cart.reduce((a,i)=>a+i.q*PRICE,0);$('#cartTotal').textContent=fmt(total);
  const lines=cart.map(i=>`• Babyglee Bounce BSTD-01 ${PRODUCTS.find(x=>x.id===i.id).name}, size ${i.size} × ${i.q}`).join('\n');
  $('#checkout').href=`https://wa.me/${WA}?text=`+encodeURIComponent(`Hi Babyglee! I'd like to order:\n${lines}\nTotal: ${fmt(total)}\nPlease confirm size & delivery.`);
}
$('#cartBody').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;const i=cart.find(x=>x.k===b.dataset.k);i.q+=+b.dataset.d;if(i.q<1)cart=cart.filter(x=>x!==i);save('bg_cart',cart);counts();renderCart()});
const openCart=()=>{$('#drawer').classList.add('on');$('#scrim').classList.add('on')};
const closeCart=()=>{$('#drawer').classList.remove('on');$('#scrim').classList.remove('on')};
$('#cartBtn').onclick=openCart;$('#closeCart').onclick=closeCart;$('#scrim').onclick=closeCart;
$('#wishBtn').onclick=()=>{setFilter('all');location.hash='#shop';toast(wish.size?`${wish.size} item(s) in your wishlist ♥`:'Tap the ♥ on any shoe to save it')};

/* mobile menu */
$('#burger').onclick=()=>$('#links').classList.toggle('on');
$$('#links a').forEach(a=>a.onclick=()=>$('#links').classList.remove('on'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeCart()}});

/* size guide (approx. EU kids sizing: size ≈ (cm + 1) * 1.5) */
function sizeCalc(){
  const cm=+$('#cm').value,eu=Math.round((cm+1.5)*1.5);
  $('#cmOut').textContent=cm.toFixed(1);$('#sizeOut').textContent='EU '+eu;
  const age=cm<12?'≈ 1 year':cm<14?'≈ 2 years':cm<16?'≈ 3–4 years':cm<18?'≈ 5–6 years':cm<19.5?'≈ 7–8 years':'≈ 9–10 years';
  $('#ageOut').textContent=age;
}
$('#cm').addEventListener('input',sizeCalc);sizeCalc();

/* reviews */
const REV=[
 ['Light and so comfy — my son wears them all day without a single complaint.','Nusrat J., Dhaka'],
 ['The team confirmed the size on WhatsApp first. Perfect fit on the first try!','Tanvir H., Chattogram'],
 ['Great price for the quality. The velcro makes mornings so much easier.','Farzana A., Sylhet'],
 ['Delivery was quick and Cash on Delivery made it stress-free.','Rafiq M., Khulna'],
 ['My daughter loves the Multi Color pair. She calls them her bouncy shoes!','Sadia K., Rajshahi'],
];
$('#revs').innerHTML=REV.map(r=>`<div class="rev"><div class="stars">★★★★★</div><p>“${r[0]}”</p><div class="who">${r[1]}</div></div>`).join('');

/* scroll reveal */
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:0,translate:'0 30px'},{opacity:1,translate:'0 0'}],{duration:600,easing:'cubic-bezier(.2,.9,.3,1.2)'});io.unobserve(e.target)}}),{threshold:.15});
  $$('.sec-title,.cat,.card3d,.rev,details,.size-in').forEach(el=>io.observe(el));
}

renderGrid();counts();renderCart();
})();
