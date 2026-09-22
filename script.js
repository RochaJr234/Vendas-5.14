/* CONTROLE DE VENDAS — núcleo simples, diário e mensal */
(() => {
  'use strict';
  const KEY='controle_vendas_v4';
  const oldKeys=['vendas','lixeira','relatorios','configuracoes'];
  const pad=n=>String(n).padStart(2,'0');
  const now=new Date();
  const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  const dateBR=k=>new Date(`${k}T12:00:00`).toLocaleDateString('pt-BR');
  const monthBR=k=>{const [y,m]=k.split('-');return new Date(Number(y),Number(m)-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())};
  const uid=()=>`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const defaultDB={version:4,config:{tema:'claro',metaLoja:115000,metaPessoal:200000},days:{},reports:[],trash:[]};
  let db=load();
  let selectedDate=null;
  let calendarView=new Date();
  calendarView.setDate(1);
  function load(){
    try{const raw=localStorage.getItem(KEY);if(raw)return normalize(JSON.parse(raw));}catch(e){}
    const migrated=structuredClone(defaultDB);
    try{
      const vendas=JSON.parse(localStorage.getItem('vendas')||'[]');
      if(Array.isArray(vendas)&&vendas.length){vendas.forEach(v=>{const k=v.data||v.date||dateKey(new Date());if(!migrated.days[k])migrated.days[k]={closed:false,sales:[]};migrated.days[k].sales.push({id:v.id||uid(),value:Number(v.valor||v.value||0),time:v.hora||v.time||'12:00'});});}
      const c=JSON.parse(localStorage.getItem('configuracoes')||'null');if(c){migrated.config.metaLoja=Number(c.metaLoja)||115000;migrated.config.metaPessoal=Number(c.metaPessoal)||200000;migrated.config.tema=c.tema||'claro';}
    }catch(e){}
    save(migrated);return migrated;
  }
  function normalize(x){
    x={...defaultDB,...x};
    x.config={...defaultDB.config,...(x.config||{})};
    const cleanDays={};
    Object.entries(x.days||{}).forEach(([k,d])=>{
      if(!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
      const dt=new Date(`${k}T12:00:00`);
      if(Number.isNaN(dt.getTime())) return;
      const sales=Array.isArray(d?.sales)?d.sales.filter(v=>Number(v?.value)>0).map(v=>({id:v.id||uid(),value:Number(v.value),time:v.time||'12:00'})):[];
      cleanDays[k]={closed:Boolean(d?.closed),sales};
    });
    x.days=cleanDays;
    x.reports=Array.isArray(x.reports)?x.reports.filter(r=>/^\d{4}-\d{2}$/.test(r?.month)):[];
    x.trash=Array.isArray(x.trash)?x.trash:[];
    return x;
  }
  function save(data=db){localStorage.setItem(KEY,JSON.stringify(data));}
  const $=s=>document.querySelector(s);
  const els={totalDia:$('#totalDia'),totalMes:$('#totalMes'),qtd:$('#quantidadeVendas'),qtdDia:$('#quantidadeVendasDia'),pct:$('#percentualMeta'),metaLojaTexto:$('#metaLojaTexto'),percentualMetaLoja:$('#percentualMetaLoja'),faltaMetaLoja:$('#faltaMetaLoja'),necessarioDiaLoja:$('#necessarioDiaLoja'),percentualMetaPessoal:$('#percentualMetaPessoal'),valorPessoalAtual:$('#valorPessoalAtual'),valorPessoalAlvo:$('#valorPessoalAlvo'),faltaMetaPessoal:$('#faltaMetaPessoal'),necessarioDiaPessoal:$('#necessarioDiaPessoal'),barraMetaPessoal:$('#barraMetaPessoal'),projecaoTexto:$('#projecaoTexto'),projecaoDetalhe:$('#projecaoDetalhe'),valor:$('#valor'),lista:$('#listaVendas'),empty:$('#estadoVazio'),totalRodape:$('#totalDiaRodape'),contadorDia:$('#contadorDia'),status:$('#statusDia'),barra:$('#barraMeta'),pctGrande:$('#percentualMetaGrande'),metaAtual:$('#valorMetaAtual'),metaAlvo:$('#valorMetaAlvo'),tituloMes:$('#tituloMes'),dataAtual:$('#dataAtual'),grafico:$('#graficoVendas'),historico:$('#listaRelatorios'),relatorios:$('#relatoriosCompletos'),inputMetaLoja:$('#inputMetaLoja'),inputMetaPessoal:$('#inputMetaPessoal'),diaSelecionado:$('#diaSelecionadoTexto'),btnFechar:$('#btnFecharDia'),listaFechados:$('#listaDiasFechados'),contadorFechados:$('#contadorDiasFechados'),listaMesesFechados:$('#listaMesesFechados'),contadorMesesFechados:$('#contadorMesesFechados')};
  const today=()=>dateKey(new Date());
  selectedDate=today();
  function ensureDay(k){if(!db.days[k])db.days[k]={closed:false,sales:[]};return db.days[k]}
  function monthSales(m){return Object.entries(db.days).filter(([k])=>k.startsWith(m)).reduce((a,[,d])=>a.concat(d.sales||[]),[])}
  function monthTotal(m){return monthSales(m).reduce((s,v)=>s+Number(v.value||0),0)}
  function dayTotal(k){return (db.days[k]?.sales||[]).reduce((s,v)=>s+Number(v.value||0),0)}
  function setTheme(){document.body.classList.toggle('dark',db.config.tema==='escuro');$('#btnTema').innerHTML=db.config.tema==='escuro'?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>'}
  function render(){
    const k=selectedDate||today(),m=k.slice(0,7),day=ensureDay(k),dt=dayTotal(k),mt=monthTotal(m),sales=monthSales(m),goal=Number(db.config.metaLoja)||0,personalGoal=Number(db.config.metaPessoal)||0;
    const lojaPct=goal?mt/goal*100:0, pessoalPct=personalGoal?mt/personalGoal*100:0;
    const lojaFalta=Math.max(goal-mt,0), pessoalFalta=Math.max(personalGoal-mt,0);
    const nowDate=new Date(), currentMonth=monthKey(nowDate), daysInMonth=new Date(nowDate.getFullYear(),nowDate.getMonth()+1,0).getDate(), dayNumber=nowDate.getDate(), daysRemaining=Math.max(daysInMonth-dayNumber+1,1);
    const neededLoja=lojaFalta>0?lojaFalta/daysRemaining:0, neededPessoal=pessoalFalta>0?pessoalFalta/daysRemaining:0;
    const projection= currentMonth===m ? (mt/Math.max(dayNumber,1))*daysInMonth : mt;
    els.totalDia.textContent=money(dt);els.qtdDia.textContent=day.sales.length;els.totalRodape.textContent=money(dt);els.totalMes.textContent=money(mt);els.qtd.textContent=sales.length;els.pct.textContent=`${lojaPct.toFixed(1)}%`;els.pctGrande.textContent=`${lojaPct.toFixed(1)}%`;els.metaLojaTexto.textContent=lojaFalta>0?`Falta: ${money(lojaFalta)}`:`Meta atingida: ${money(Math.max(mt-goal,0))} acima`;els.metaAtual.textContent=money(mt);els.metaAlvo.textContent=`de ${money(goal)}`;els.barra.style.width=`${Math.min(100,lojaPct)}%`;
    els.percentualMetaLoja.textContent=`${lojaPct.toFixed(1)}%`;els.faltaMetaLoja.textContent=lojaFalta>0?money(lojaFalta):`Atingida +${money(mt-goal)}`;els.necessarioDiaLoja.textContent=lojaFalta>0?money(neededLoja):'R$ 0,00';
    els.percentualMetaPessoal.textContent=`${pessoalPct.toFixed(1)}%`;els.valorPessoalAtual.textContent=money(mt);els.valorPessoalAlvo.textContent=`de ${money(personalGoal)}`;els.faltaMetaPessoal.textContent=pessoalFalta>0?money(pessoalFalta):`Atingida +${money(mt-personalGoal)}`;els.necessarioDiaPessoal.textContent=pessoalFalta>0?money(neededPessoal):'R$ 0,00';els.barraMetaPessoal.style.width=`${Math.min(100,pessoalPct)}%`;
    if(currentMonth!==m){els.projecaoTexto.textContent='Mês fora do período atual';els.projecaoDetalhe.textContent='A projeção diária é calculada apenas para o mês atual.';}else{const mediaAtual=mt/Math.max(dayNumber,1);els.projecaoTexto.textContent=`No ritmo atual: ${money(projection)}`;els.projecaoDetalhe.textContent=`Média de ${money(mediaAtual)}/dia · ${daysRemaining} dia(s) disponíveis. Loja: ${lojaFalta>0?money(neededLoja)+'/dia':'meta atingida'} · Pessoal: ${pessoalFalta>0?money(neededPessoal)+'/dia':'meta atingida'}.`;}
    els.tituloMes.textContent=monthBR(m);els.dataAtual.textContent=dateBR(k);els.diaSelecionado.textContent=k===today()?'Hoje':dateBR(k);els.contadorDia.textContent=`${day.sales.length} ${day.sales.length===1?'venda':'vendas'}`;els.status.textContent=day.closed?'Dia fechado':'Dia aberto';els.status.classList.toggle('closed',day.closed);
    els.btnFechar.innerHTML=day.closed?'<i class="fa-solid fa-lock-open"></i><span>Reabrir dia</span>':'<i class="fa-solid fa-lock"></i><span>Fechar dia</span>';els.btnFechar.classList.toggle('closed',day.closed);els.lista.innerHTML=day.closed?`<div class="closed-summary"><div><strong>Dia encerrado</strong><span>${day.sales.length} ${day.sales.length===1?'venda registrada':'vendas registradas'}</span></div><strong class="closed-summary-total">${money(dt)}</strong></div>`:day.sales.slice().reverse().map((v,i)=>`<div class="sale-row"><div class="sale-number">${day.sales.length-i}</div><div><strong class="sale-value">${money(v.value)}</strong><div class="sale-time">${v.time||''}</div></div><div></div><button class="delete-btn" data-delete="${v.id}" title="Mover para lixeira"><i class="fa-solid fa-trash"></i></button></div>`).join('');els.empty.classList.toggle('show',day.sales.length===0&&!day.closed);
    renderClosedDays(m);
    renderClosedMonths();
    els.grafico.innerHTML=renderChart(m);renderReports();
  }
  function renderClosedDays(m){
    const entries=Object.entries(db.days).filter(([k,d])=>k.startsWith(m)&&d?.closed).sort((a,b)=>b[0].localeCompare(a[0]));
    els.contadorFechados.textContent=String(entries.length);
    els.listaFechados.innerHTML=entries.map(([k,d])=>{
      const sales=(d.sales||[]).slice().reverse();
      const salesHtml=sales.length
        ? sales.map((v,i)=>`<div class="closed-sale-row"><span class="closed-sale-number">${sales.length-i}</span><div><strong>${money(v.value)}</strong><small>${v.time||''}</small></div></div>`).join('')
        : '<div class="closed-sales-empty">Nenhuma venda registrada neste dia.</div>';
      return `<details class="closed-day-folder">
        <summary class="closed-day-item">
          <span class="closed-day-icon"><i class="fa-solid fa-lock"></i></span>
          <span class="closed-day-info"><strong>${dateBR(k)}</strong><span>${sales.length} ${sales.length===1?'venda':'vendas'} · Dia encerrado</span></span>
          <strong class="closed-day-total">${money(dayTotal(k))}</strong>
        </summary>
        <div class="closed-day-details">
          <div class="closed-day-details-head"><span>Vendas individuais</span><span>${sales.length} ${sales.length===1?'venda':'vendas'}</span></div>
          <div class="closed-sales-list">${salesHtml}</div>
          <div class="closed-day-details-footer"><strong>Total do dia</strong><strong>${money(dayTotal(k))}</strong></div>
          <button type="button" class="secondary-btn open-closed-day" data-open-closed-day="${k}"><i class="fa-solid fa-calendar"></i> Abrir este dia</button>
        </div>
      </details>`;
    }).join('')||'<div class="closed-days-empty">Nenhum dia fechado neste mês.</div>';
  }
  function renderClosedMonths(){
    const current=monthKey(new Date());
    const months=[...new Set(Object.keys(db.days).map(k=>k.slice(0,7)).filter(m=>m<current))].sort().reverse().slice(0,12);
    els.contadorMesesFechados.textContent=String(months.length);
    els.listaMesesFechados.innerHTML=months.map(m=>{const r=reportFor(m);return `<div class="closed-month-item" data-report="${m}"><div class="closed-month-icon"><i class="fa-solid fa-folder-closed"></i></div><div class="closed-month-info"><strong>${monthBR(m)}</strong><span>${r.sales} ${r.sales===1?'venda':'vendas'} · ${r.closed} ${r.closed===1?'dia fechado':'dias fechados'}</span></div><strong class="closed-month-total">${money(r.total)}</strong></div>`}).join('')||'<div class="closed-months-empty">Nenhum mês fechado ainda.</div>';
  }
  function renderChart(m){const entries=Object.entries(db.days).filter(([k,d])=>k.startsWith(m)&&(d.sales?.length)).sort((a,b)=>a[0].localeCompare(b[0])).slice(-7);if(!entries.length)return '<div class="empty-reports" style="width:100%">Ainda não há dados para o gráfico.</div>';const max=Math.max(...entries.map(([,d])=>dayTotal(Object.keys(db.days).find(k=>db.days[k]===d)||'')),1);return entries.map(([k,d])=>{const t=dayTotal(k);return `<div class="bar-wrap"><span class="bar-value">${t>=1000?(t/1000).toFixed(1)+'k':Math.round(t)}</span><div class="bar" style="height:${Math.max(4,t/max*105)}px"></div><span class="bar-label">${k.slice(-2)}</span></div>`}).join('')}
  function reportFor(m){const days=Object.entries(db.days).filter(([k])=>k.startsWith(m));const total=days.reduce((s,[,d])=>s+dayTotalFrom(d),0),sales=days.reduce((s,[,d])=>s+(d.sales?.length||0),0),closed=days.filter(([,d])=>d.closed).length;return {month:m,total,sales,closed,days:days.map(([k,d])=>({date:k,total:dayTotal(k),count:d.sales?.length||0,closed:d.closed})).sort((a,b)=>a.date.localeCompare(b.date))}}
  const dayTotalFrom=d=>(d.sales||[]).reduce((s,v)=>s+Number(v.value||0),0);
  function updateReports(){const months=Object.keys(db.days).map(k=>k.slice(0,7));const unique=[...new Set(months)].sort().reverse().slice(0,12);db.reports=unique.map(reportFor);save()}
  function renderReports(){updateReports();const reps=db.reports;els.historico.innerHTML=reps.slice(0,4).map(r=>`<div class="history-item" data-report="${r.month}"><div><strong>${monthBR(r.month)}</strong><span>${r.sales} vendas · ${r.closed} dias fechados</span></div><strong>${money(r.total)}</strong></div>`).join('')||'<div class="empty-reports">Nenhum mês fechado ainda.</div>';els.relatorios.innerHTML=reps.map(r=>`<div class="report-card"><h4>${monthBR(r.month)}</h4><div class="report-total">${money(r.total)}</div><div class="report-meta"><span>${r.sales} vendas</span><span>${r.closed} dias fechados</span></div><button data-report="${r.month}">Ver detalhes <i class="fa-solid fa-arrow-right"></i></button></div>`).join('')||'<div class="empty-reports">Os relatórios mensais aparecerão aqui.</div>'}
  function addSale(){const value=Number(String(els.valor.value).replace(',','.'));const k=selectedDate||today(),day=ensureDay(k);if(day.closed)return toast('Este dia está fechado. Reabra o dia para lançar a venda.','warn');if(!value||value<=0)return toast('Digite um valor válido.','warn');const t=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});day.sales.push({id:uid(),value,time:t});els.valor.value='';save();render();toast('Venda registrada com sucesso.')}
  function toggleDay(){const k=selectedDate||today(),d=ensureDay(k);if(d.closed){if(!confirm(`Reabrir o dia ${dateBR(k)}? Você poderá lançar novas vendas novamente.`))return;d.closed=false;save();render();$('#pastaDiasFechados').open=false;toast('Dia reaberto. Agora você pode lançar vendas.');return}if(!d.sales.length)return toast('Registre pelo menos uma venda antes de fechar o dia.','warn');if(!confirm(`Fechar o dia ${dateBR(k)}? Você poderá reabri-lo depois se precisar.`))return;d.closed=true;save();render();const p=$('#pastaDiasFechados');if(p)p.open=false;const pm=$('#pastaMesesFechados');if(pm)pm.open=false;toast('Dia fechado e guardado na pasta Dias fechados.')}
  function deleteSale(id){const k=selectedDate||today(),d=ensureDay(k);if(d.closed)return toast('O dia está fechado.','warn');const idx=d.sales.findIndex(v=>v.id===id);if(idx<0)return;const [sale]=d.sales.splice(idx,1);db.trash.push({id:uid(),originalId:sale.id,date:k,sale,deletedAt:new Date().toISOString()});save();render();toast('Venda movida para a lixeira.')}
  function selectDay(k){selectedDate=k;calendarView=new Date(`${k}T12:00:00`);calendarView.setDate(1);closeModal('modalCalendario');render();toast(`Dia selecionado: ${dateBR(k)}`)}
  function renderCalendar(){const y=calendarView.getFullYear(),m=calendarView.getMonth();$('#calendarioMesTitulo').textContent=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let html='';for(let i=0;i<first;i++)html+='<div></div>';for(let day=1;day<=days;day++){const k=dateKey(new Date(y,m,day)),d=db.days[k],has=d?.sales?.length>0,closed=Boolean(d?.closed),todayFlag=k===today(),sel=k===selectedDate;html+=`<button type="button" class="calendar-day${todayFlag?' today':''}${sel?' selected':''}${closed?' closed':''}" data-calendar-day="${k}"><span>${day}</span>${has?`<span class="dot${closed?' closed-dot':''}"></span>`:''}</button>`}$('#calendarioGrid').innerHTML=html}
  function openCalendar(){const base=new Date(`${(selectedDate||today())}T12:00:00`);calendarView=new Date(base.getFullYear(),base.getMonth(),1);renderCalendar();openModal('modalCalendario')}

  function openReport(m){const r=db.reports.find(x=>x.month===m)||reportFor(m);$('#modalRelatorioTitulo').textContent=monthBR(m);$('#modalRelatorioConteudo').innerHTML=`<div class="report-detail-grid"><div class="detail-box"><span>Total</span><strong>${money(r.total)}</strong></div><div class="detail-box"><span>Vendas</span><strong>${r.sales}</strong></div><div class="detail-box"><span>Dias fechados</span><strong>${r.closed}</strong></div><div class="detail-box"><span>Média por venda</span><strong>${money(r.sales?r.total/r.sales:0)}</strong></div></div><div class="detail-days">${r.days.map(d=>`<div class="detail-day"><span>${dateBR(d.date)} · ${d.count} vendas${d.closed?' · ✓ fechado':''}</span><strong>${money(d.total)}</strong></div>`).join('')||'<div class="empty-reports">Nenhum dia registrado.</div>'}</div>`;openModal('modalRelatorio')}
  function openModal(id){const m=$('#'+id);m.classList.add('open');m.setAttribute('aria-hidden','false')}
  function closeModal(id){const m=$('#'+id);m.classList.remove('open');m.setAttribute('aria-hidden','true')}
  function toast(msg,type){const t=$('#toast');t.querySelector('span').textContent=msg;t.querySelector('i').className=type==='warn'?'fa-solid fa-triangle-exclamation':'fa-solid fa-circle-check';t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2600)}
  function backup(){
    try{
      const payload={
        backupType:'CONTROLE_VENDAS_BACKUP',
        backupVersion:1,
        appVersion:'5.13',
        exportedAt:new Date().toISOString(),
        data:normalize(structuredClone(db))
      };
      const json=JSON.stringify(payload,null,2);
      const blob=new Blob([json],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=`controle-vendas-backup-${today()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast('Backup salvo no aparelho com sucesso.');
    }catch(e){
      console.error(e);
      toast('Não foi possível criar o backup.','warn');
    }
  }
  function restore(file){
    if(!file)return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const raw=JSON.parse(r.result);
        let importedData=null;
        if(raw && raw.backupType==='CONTROLE_VENDAS_BACKUP' && raw.data){
          importedData=raw.data;
        }else if(raw && raw.days && raw.config){
          importedData=raw;
        }else{
          throw new Error('Formato inválido');
        }
        const imported=normalize(importedData);
        const dayCount=Object.keys(imported.days).length;
        const saleCount=Object.values(imported.days).reduce((n,d)=>n+(d.sales?.length||0),0);
        if(!confirm(`Restaurar este backup?\n\n${dayCount} dia(s) salvo(s)\n${saleCount} venda(s)\n\nOs dados atuais deste navegador serão substituídos.`))return;
        db=imported;
        selectedDate=today();
        save();
        setTheme();
        render();
        document.querySelectorAll('details').forEach(d=>d.open=false);
        toast('Backup restaurado com sucesso.');
      }catch(e){
        console.error(e);
        toast('Arquivo de backup inválido ou corrompido.','warn');
      }
    };
    r.onerror=()=>toast('Não foi possível ler o arquivo de backup.','warn');
    r.readAsText(file);
  }
  function resetAll(){if(!confirm('Resetar o sistema apagará vendas, dias fechados, relatórios e lixeira deste navegador. Continuar?'))return;if(!confirm('Última confirmação: deseja realmente apagar todos os dados?'))return;try{localStorage.removeItem(KEY);oldKeys.forEach(k=>localStorage.removeItem(k));}catch(e){};db=structuredClone(defaultDB);selectedDate=today();save();setTheme();render();document.querySelectorAll('details').forEach(d=>d.open=false);toast('Sistema resetado. Todos os dados foram apagados.','warn')}
  $('#btnReset').addEventListener('click',resetAll);  $('#btnAdicionar').addEventListener('click',addSale);els.valor.addEventListener('keydown',e=>{if(e.key==='Enter')addSale()});$('#btnFecharDia').addEventListener('click',toggleDay);$('#btnCalendario').addEventListener('click',openCalendar);$('#btnMesAnterior').addEventListener('click',()=>{calendarView.setMonth(calendarView.getMonth()-1);renderCalendar()});$('#btnMesProximo').addEventListener('click',()=>{calendarView.setMonth(calendarView.getMonth()+1);renderCalendar()});$('#btnVoltarHoje').addEventListener('click',()=>selectDay(today()));$('#calendarioGrid').addEventListener('click',e=>{const b=e.target.closest('[data-calendar-day]');if(b)selectDay(b.dataset.calendarDay)});els.listaFechados.addEventListener('click',e=>{const b=e.target.closest('[data-open-closed-day]');if(b){e.preventDefault();selectDay(b.dataset.openClosedDay);document.getElementById('pastaDiasFechados').open=false;}});$('#listaMesesFechados').addEventListener('click',e=>{const b=e.target.closest('[data-report]');if(b){openReport(b.dataset.report);document.getElementById('pastaMesesFechados').open=false;}});els.lista.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(b)deleteSale(b.dataset.delete)});document.querySelectorAll('.quick-values button').forEach(b=>b.addEventListener('click',()=>{els.valor.value=(Number(els.valor.value||0)+Number(b.dataset.value)).toFixed(2);els.valor.focus()}));$('#btnTema').addEventListener('click',()=>{db.config.tema=db.config.tema==='escuro'?'claro':'escuro';save();setTheme()});$('#btnBackup').addEventListener('click',backup);$('#btnRestaurar').addEventListener('click',()=>$('#arquivoBackup').click());$('#arquivoBackup').addEventListener('change',e=>{if(e.target.files[0])restore(e.target.files[0]);e.target.value='' });$('#btnConfiguracoes').addEventListener('click',()=>{els.inputMetaLoja.value=db.config.metaLoja;els.inputMetaPessoal.value=db.config.metaPessoal;openModal('modalConfiguracoes')});$('#btnSalvarConfiguracoes').addEventListener('click',()=>{db.config.metaLoja=Math.max(0,Number(els.inputMetaLoja.value)||0);db.config.metaPessoal=Math.max(0,Number(els.inputMetaPessoal.value)||0);save();render();closeModal('modalConfiguracoes');toast('Configurações salvas.')});$('#btnVerRelatorios').addEventListener('click',()=>$('#secaoRelatorios').scrollIntoView({behavior:'smooth'}));document.addEventListener('click',e=>{const close=e.target.closest('[data-close]');if(close)closeModal(close.dataset.close);const rep=e.target.closest('[data-report]');if(rep)openReport(rep.dataset.report)});document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
  updateReports();setTheme();render();setTimeout(()=>$('#appLoader').classList.add('hide'),450);
})();
