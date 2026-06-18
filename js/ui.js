const UI = (() => {
    let currentTab = 'today_view';
    let currentFilterDate = '';
    let currentFilterOrigin = 'all';
    let currentFilterDest = 'all';
    let currentModalType = null;
    let currentCageId = null;
    let progressTimer = null;

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function renderStats() {
        const s = OrderManager.getOrderStats();
        const c = CageManager.getCageStats();

        document.getElementById('statsBar').innerHTML = `
            <div class="stat-card stat-pending">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="stat-info">
                    <h3>今日待处理</h3>
                    <div class="stat-value">${s.today_pending_all || s.today_pending + s.today_waiting}<small> 单</small></div>
                </div>
            </div>
            <div class="stat-card stat-transit">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><polyline points="23 3 13.5 12.5 9 8"/><path d="M22 16.92V21a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4.08"/></svg>
                </div>
                <div class="stat-info">
                    <h3>运输中</h3>
                    <div class="stat-value">${s.today_in_transit}<small> 单</small></div>
                </div>
            </div>
            <div class="stat-card stat-delivered">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="stat-info">
                    <h3>已完成</h3>
                    <div class="stat-value">${s.delivered}<small> 单</small></div>
                </div>
            </div>
            <div class="stat-card stat-cages">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </div>
                <div class="stat-info">
                    <h3>笼位 ${c.occupied}/${c.total}</h3>
                    <div class="stat-value">${c.occupancyRate}<small>%</small></div>
                </div>
            </div>
        `;
    }

    function getFilteredOrders() {
        const options = {
            origin: currentFilterOrigin,
            destination: currentFilterDest
        };

        if (currentFilterDate) options.dateStr = currentFilterDate;

        if (currentTab === 'today_view') {
            options.todayOnly = true;
            options.pendingOrTransit = true;
        } else if (currentTab !== 'all') {
            options.status = currentTab;
        }

        return OrderManager.filterOrders(options);
    }

    function renderOrderList() {
        const orders = getFilteredOrders();
        const listEl = document.getElementById('orderList');

        if (orders.length === 0) {
            listEl.innerHTML = `
                <div class="order-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>${currentTab === 'today_view' ? '今日暂无待处理订单' : '暂无符合条件的订单'}</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = orders.map(order => renderOrderCard(order)).join('');

        listEl.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn') && !e.target.closest('button')) {
                    openOrderDetail(card.dataset.orderId);
                }
            });
        });

        listEl.querySelectorAll('[data-action="advance"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                advanceOrderStatus(btn.dataset.orderId);
            });
        });

        listEl.querySelectorAll('[data-action="detail"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openOrderDetail(btn.dataset.orderId);
            });
        });
    }

    function renderOrderCard(order) {
        const nextStatus = OrderManager.getNextStatus(order.status);
        const canAdvance = OrderManager.canAdvanceStatus(order.id);
        const hasAbnormal = Store.hasAbnormalHealth(order.id);
        const progress = OrderManager.getTransportProgress(order.id);
        const progressPct = order.status === 'in_transit' ? Math.round(progress.eta.progress * 100) : 0;

        return `
            <div class="order-card ${hasAbnormal ? 'has-abnormal' : ''}" data-order-id="${order.id}">
                <div class="order-card-header">
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <span class="order-id">${order.order_no}</span>
                        ${hasAbnormal ? `<span class="abnormal-badge" title="有异常记录">⚠️ 异常</span>` : ''}
                    </div>
                    <span class="status-badge ${order.status}">${Store.STATUS_LABELS[order.status]}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-info-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.17C12 5.17 8.5 2 4.5 4.5C2 7 2.5 11 6 13.5C8.5 15.5 11 14.5 12 13C13 14.5 15.5 15.5 18 13.5C21.5 11 22 7 19.5 4.5C15.5 2 12 5.17 12 5.17Z"/></svg>
                        <strong>${order.pet_breed}</strong> · ${order.pet_weight}kg · ${order.vaccinated ? '✓苗' : '✗苗'}
                    </div>
                    <div class="order-info-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        <strong>${order.cage_label || order.cage_id}</strong>
                    </div>
                    <div class="order-info-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        <strong>${order.origin}</strong> → <strong>${order.destination}</strong>
                    </div>
                    <div class="order-info-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <strong>${order.ship_date}</strong>
                    </div>
                </div>
                ${order.status === 'in_transit' ? `
                    <div class="progress-bar-mini" title="运输进度 ${progressPct}%">
                        <div class="progress-fill" style="width:${progressPct}%"></div>
                        <span class="progress-label">${progressPct}%</span>
                    </div>
                ` : ''}
                <div class="order-card-footer">
                    <span style="font-size:0.8rem;color:var(--color-text-light)">${Store.formatDateTime(order.created_at)}</span>
                    <div class="order-actions">
                        <button class="btn btn-sm btn-secondary" data-action="detail" data-order-id="${order.id}">详情</button>
                        ${canAdvance && nextStatus ? `
                            <button class="btn btn-sm btn-primary" data-action="advance" data-order-id="${order.id}">
                                ${Store.STATUS_LABELS[nextStatus]} →
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function renderCageGrid() {
        const cages = CageManager.getAllCages();
        const gridEl = document.getElementById('cageGrid');

        gridEl.innerHTML = cages.map(cage => {
            const order = cage.status === 'occupied' ? CageManager.getOrderByCage(cage.id) : null;
            const disinfectDays = Math.floor((Date.now() - new Date(cage.last_disinfected).getTime()) / 86400000);
            const disinfectText = disinfectDays < 1 ? '今日已消毒' : `${Math.floor(disinfectDays)}天前消毒`;
            const needsDisinfect = disinfectDays >= 3;
            const statusText = {available: '空闲', occupied: '占用', cleaning: '消毒中'}[cage.status];
            const cellTitle = order ? `${order.pet_breed} (${order.order_no})` : statusText;

            return `
                <div class="cage-cell ${cage.status} ${needsDisinfect && cage.status !== 'cleaning' ? 'needs-disinfect' : ''}" 
                     data-cage-id="${cage.id}"
                     title="${cellTitle}">
                    <div class="cage-header">
                        <span class="cage-label">${cage.label}</span>
                        ${order ? `<span class="cage-order-tag">${order.pet_breed.substring(0,3)}</span>` : ''}
                        ${cage.status === 'cleaning' ? `<span class="cage-clean-tag">消毒</span>` : ''}
                    </div>
                    <div class="cage-env">
                        <span title="温度"><span class="env-val">${cage.temperature.toFixed(1)}°C</span></span>
                        <span title="湿度"><span class="env-val">${cage.humidity.toFixed(0)}%</span></span>
                    </div>
                    <div class="cage-disinfect ${needsDisinfect && cage.status !== 'cleaning' ? 'warning' : ''}">${disinfectText}</div>
                </div>
            `;
        }).join('');

        gridEl.querySelectorAll('.cage-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                openCageDetail(cell.dataset.cageId);
            });
        });
    }

    function openOrderDetail(orderId) {
        const order = OrderManager.getOrderById(orderId);
        if (!order) {
            showToast('订单不存在', 'error');
            return;
        }

        currentModalType = 'order';
        const nextStatus = OrderManager.getNextStatus(order.status);
        const canAdvance = OrderManager.canAdvanceStatus(order.id);
        const timeline = OrderManager.getStatusTimeline(order.id);
        const progress = OrderManager.getTransportProgress(order.id);
        const healthLogs = Store.getHealthLogsByOrder(order.id);
        const hasAbnormal = Store.hasAbnormalHealth(order.id);

        document.getElementById('modalTitle').textContent = `订单详情 · ${order.order_no}`;
        document.getElementById('modalBody').innerHTML = renderOrderDetailContent(order, timeline, progress, healthLogs, nextStatus, canAdvance, hasAbnormal);
        document.getElementById('modalOverlay').style.display = 'flex';

        setTimeout(() => {
            initDetailMap(order, progress);
            bindOrderDetailEvents(orderId);
        }, 100);
    }

    function renderOrderDetailContent(order, timeline, progress, healthLogs, nextStatus, canAdvance, hasAbnormal) {
        const etaText = getNodeETAInfo(order, progress);

        return `
            <div class="detail-section">
                <div class="detail-header-row">
                    <h4>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.17C12 5.17 8.5 2 4.5 4.5C2 7 2.5 11 6 13.5C8.5 15.5 11 14.5 12 13C13 14.5 15.5 15.5 18 13.5C21.5 11 22 7 19.5 4.5C15.5 2 12 5.17 12 5.17Z"/></svg>
                        宠物信息
                        ${hasAbnormal ? `<span class="abnormal-badge" style="margin-left:8px;">⚠️ 有异常记录</span>` : ''}
                    </h4>
                    <span class="status-badge ${order.status} large">${Store.STATUS_LABELS[order.status]}</span>
                </div>
                <div class="detail-info-grid">
                    <div class="detail-info-item"><div class="label">品种</div><div class="value">${order.pet_breed}</div></div>
                    <div class="detail-info-item"><div class="label">体重</div><div class="value">${order.pet_weight} kg</div></div>
                    <div class="detail-info-item"><div class="label">疫苗</div><div class="value">${order.vaccinated ? '<span style="color:var(--color-success)">✓ 已接种</span>' : '<span style="color:var(--color-warning)">✗ 未接种</span>'}</div></div>
                    <div class="detail-info-item"><div class="label">分配笼位</div><div class="value"><span class="status-badge occupied" style="cursor:pointer;" id="cageLinkInOrder">${order.cage_label || order.cage_id}</span></div></div>
                </div>
            </div>

            <div class="detail-section">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    运输过程
                </h4>
                ${renderTransportPanel(order, progress, etaText)}
                <div id="mapContainer" class="map-container"></div>
            </div>

            <div class="detail-section">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    状态追踪时间线
                </h4>
                ${renderTimeline(timeline)}
            </div>

            <div class="detail-section">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    护理日志
                </h4>
                ${renderHealthLogs(healthLogs)}
                ${waitingForHealthLog(order.status) ? renderHealthForm() : ''}
            </div>

            <div class="modal-actions">
                <button class="btn btn-secondary" id="exportPdfBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    导出托运单PDF
                </button>
                ${canAdvance && nextStatus ? `
                    <button class="btn btn-primary" id="advanceStatusBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        更新为「${Store.STATUS_LABELS[nextStatus]}」
                    </button>
                ` : ''}
            </div>
        `;
    }

    function getNodeETAInfo(order, progress) {
        const desc = Store.STATUS_DESCRIPTIONS[order.status];
        const logs = Store.getStatusLogsByOrder(order.id);
        const statusLog = logs.find(l => l.status === order.status);
        const time = statusLog ? new Date(statusLog.timestamp) : null;
        const addHours = (d, h) => new Date(d.getTime() + h * 3600 * 1000);

        let etaTime = null;
        let etaText = desc.etaText;

        if (order.status === 'in_transit') {
            const transitLog = logs.find(l => l.status === 'in_transit');
            if (transitLog) {
                const startMs = new Date(transitLog.timestamp).getTime();
                const totalMs = progress.eta.totalMs;
                etaTime = new Date(startMs + totalMs);
                etaText = '预计到达';
            }
        } else if (desc.etaHours !== null && time) {
            etaTime = addHours(time, desc.etaHours);
        } else if (order.status === 'delivered' && time) {
            etaTime = time;
        }

        return {
            currentTitle: desc.title,
            etaText,
            etaTime,
            distance: progress.eta.distance,
            totalHours: progress.eta.totalHours,
            progress: progress.eta.progress
        };
    }

    function renderTransportPanel(order, progress, eta) {
        const progressPct = Math.round(eta.progress * 100);
        const isTransit = order.status === 'in_transit' || order.status === 'arrived' || order.status === 'delivered';

        return `
            <div class="transport-overview">
                <div class="transport-route">
                    <div class="route-city">
                        <div class="route-dot origin"></div>
                        <div>
                            <div class="city-name">${order.origin}</div>
                            <div class="city-label">起运地</div>
                        </div>
                    </div>
                    <div class="route-progress">
                        <div class="route-line-bg"></div>
                        <div class="route-line-fill" style="width:${progressPct}%"></div>
                        <div class="route-progress-info">
                            <span>${eta.distance}km</span>
                            <span>约${eta.totalHours}小时</span>
                            <span class="route-pct">${progressPct}%</span>
                        </div>
                    </div>
                    <div class="route-city">
                        <div class="route-dot dest"></div>
                        <div>
                            <div class="city-name">${order.destination}</div>
                            <div class="city-label">目的地</div>
                        </div>
                    </div>
                </div>
                <div class="transport-status-card">
                    <div class="status-now">
                        <span class="status-now-label">当前节点</span>
                        <span class="status-now-title">${eta.currentTitle}</span>
                    </div>
                    ${eta.etaTime ? `
                        <div class="status-eta">
                            <span class="eta-label">${eta.etaText}</span>
                            <span class="eta-time">${Store.formatDateTime(eta.etaTime)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            ${!isTransit ? `
                <div class="transport-nodes">
                    ${renderTransportNodes(order)}
                </div>
            ` : ''}
        `;
    }

    function renderTransportNodes(order) {
        const nodes = [
            { key: 'pending', label: '接单确认', desc: '运营人员确认订单并分配司机', hours: '1小时内' },
            { key: 'waiting_pickup', label: '上门取宠', desc: '司机前往起点城市取宠并检查状态', hours: '3小时内' },
            { key: 'in_transit', label: '运输途中', desc: '专业笼位恒温运输', hours: '按距离' },
            { key: 'arrived', label: '到达派送', desc: '到达目的地城市并安排派送', hours: '2小时内' },
            { key: 'delivered', label: '签收完成', desc: '客户签收，运输完成', hours: '即时' }
        ];
        const currentIdx = Store.STATUS_FLOW.indexOf(order.status);

        return nodes.map((n, i) => `
            <div class="t-node ${i < currentIdx ? 'done' : ''} ${i === currentIdx ? 'active' : ''}">
                <div class="t-node-dot">${i < currentIdx ? '✓' : (i + 1)}</div>
                <div class="t-node-info">
                    <div class="t-node-label">${n.label}</div>
                    <div class="t-node-desc">${n.desc}</div>
                    <div class="t-node-time">${n.hours}</div>
                </div>
            </div>
        `).join('');
    }

    function renderTimeline(timeline) {
        return `
            <div class="timeline">
                ${timeline.map(t => `
                    <div class="timeline-item ${t.completed ? 'completed' : ''} ${t.current ? 'current' : ''}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-status">
                                ${t.label}
                                ${t.current ? `<span class="timeline-current-tag">当前</span>` : ''}
                            </div>
                            <div class="timeline-desc" style="font-size:0.8rem;color:var(--color-text-light);margin-bottom:0.25rem;">${t.description.title}</div>
                            ${t.timestamp ? `
                                <div class="timeline-meta">
                                    ${Store.formatDateTime(t.timestamp)} · 操作人: <strong>${t.operator || '-'}</strong>
                                </div>
                            ` : `<div class="timeline-meta" style="color:#CBD5E1;">尚未完成</div>`}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderHealthLogs(logs) {
        if (logs.length === 0) {
            return '<p style="color:var(--color-text-light);font-size:0.9rem;">暂无护理记录</p>';
        }
        return logs.map(log => `
            <div class="health-record ${log.is_abnormal ? 'abnormal' : ''}">
                <div class="health-record-meta">
                    ${Store.formatDateTime(log.timestamp)} · 记录人: ${log.operator || '-'}
                    ${log.is_abnormal ? `<span class="abnormal-flag">${log.abnormal_type || '异常'}</span>` : ''}
                </div>
                <div class="health-record-body">
                    <div><strong>饮食:</strong> ${log.diet_status || '-'}</div>
                    <div><strong>精神:</strong> ${log.mental_status || '-'}</div>
                    ${log.notes ? `<div style="grid-column: span 2;"><strong>备注:</strong> <span style="color:#fff;">${log.notes}</span></div>` : ''}
                </div>
            </div>
        `).join('');
    }

    function waitingForHealthLog(status) {
        return ['waiting_pickup', 'in_transit', 'arrived'].includes(status);
    }

    function renderHealthForm() {
        return `
            <form class="health-form-extended" id="healthForm">
                <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
                    <div class="form-group">
                        <label>饮食状态</label>
                        <select id="dietStatus">
                            <option value="饮食正常">饮食正常</option>
                            <option value="食欲良好">食欲良好</option>
                            <option value="食欲一般">食欲一般</option>
                            <option value="食欲不振">食欲不振</option>
                            <option value="未进食">未进食</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>精神状态</label>
                        <select id="mentalStatus">
                            <option value="精神状态良好">精神状态良好</option>
                            <option value="活泼好动">活泼好动</option>
                            <option value="安静">安静</option>
                            <option value="略显疲惫">略显疲惫</option>
                            <option value="精神萎靡">精神萎靡</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>护理备注</label>
                    <textarea id="healthNotes" rows="2" placeholder="详细描述观察情况、喂食情况等" style="width:100%;padding:0.6rem;border:1.5px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-sans);font-size:0.9rem;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;">
                    <label class="checkbox-label" style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                        <input type="checkbox" id="isAbnormal" style="width:18px;height:18px;accent-color:var(--color-danger);">
                        <span style="color:var(--color-danger);font-weight:500;">标记为异常状态</span>
                    </label>
                    <select id="abnormalType" style="display:none;padding:0.5rem;border:1.5px solid var(--color-border);border-radius:var(--radius-sm);">
                        <option value="">异常类型</option>
                        <option value="饮食异常">饮食异常</option>
                        <option value="精神异常">精神异常</option>
                        <option value="体温异常">体温异常</option>
                        <option value="呕吐腹泻">呕吐腹泻</option>
                        <option value="其他异常">其他异常</option>
                    </select>
                    <button type="submit" class="btn btn-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        添加护理记录
                    </button>
                </div>
            </form>
        `;
    }

    function initDetailMap(order, progress) {
        MapView.init('mapContainer');
        const isTransit = ['in_transit', 'arrived', 'delivered'].includes(order.status);
        MapView.showRoute(order.origin_coords, order.dest_coords, order.origin, order.destination, {
            initialProgress: isTransit ? progress.eta.progress : 0,
            animateProgress: isTransit && order.status === 'in_transit',
            targetProgress: isTransit ? progress.eta.progress : 0
        });
    }

    function bindOrderDetailEvents(orderId) {
        const order = OrderManager.getOrderById(orderId);

        const cageLink = document.getElementById('cageLinkInOrder');
        if (cageLink) {
            cageLink.addEventListener('click', () => {
                closeModal();
                setTimeout(() => openCageDetail(order.cage_id), 200);
            });
        }

        const isAbnormalCb = document.getElementById('isAbnormal');
        const abnormalTypeSel = document.getElementById('abnormalType');
        if (isAbnormalCb && abnormalTypeSel) {
            isAbnormalCb.addEventListener('change', () => {
                abnormalTypeSel.style.display = isAbnormalCb.checked ? 'inline-block' : 'none';
            });
        }

        const healthForm = document.getElementById('healthForm');
        if (healthForm) {
            healthForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const operator = document.getElementById('operatorName').value || Store.getOperator();
                const isAbnormal = document.getElementById('isAbnormal').checked;
                OrderManager.addHealthLog(orderId, {
                    diet_status: document.getElementById('dietStatus').value,
                    mental_status: document.getElementById('mentalStatus').value,
                    notes: document.getElementById('healthNotes').value,
                    is_abnormal: isAbnormal,
                    abnormal_type: isAbnormal ? document.getElementById('abnormalType').value : ''
                }, operator);
                showToast('护理记录已添加', isAbnormal ? 'warning' : 'success');
                refreshAll();
                openOrderDetail(orderId);
            });
        }

        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                PdfGenerator.generateShippingOrder(order);
                showToast('托运单PDF已导出', 'success');
            });
        }

        const advanceStatusBtn = document.getElementById('advanceStatusBtn');
        if (advanceStatusBtn) {
            advanceStatusBtn.addEventListener('click', () => {
                advanceOrderStatus(orderId);
            });
        }
    }

    function openCageDetail(cageId) {
        const detail = CageManager.getCageDetail(cageId);
        if (!detail) return;
        const { cage, order, envLogs, disinfectLogs } = detail;

        currentModalType = 'cage';
        currentCageId = cageId;

        document.getElementById('modalTitle').textContent = `笼位详情 · ${cage.label}`;
        document.getElementById('modalBody').innerHTML = renderCageDetailContent(cage, order, envLogs, disinfectLogs);
        document.getElementById('modalOverlay').style.display = 'flex';

        bindCageDetailEvents(cage, order);
    }

    function renderCageDetailContent(cage, order, envLogs, disinfectLogs) {
        const disinfectDays = Math.floor((Date.now() - new Date(cage.last_disinfected).getTime()) / 86400000);
        const statusLabel = {available:'空闲可用',occupied:'使用中',cleaning:'消毒中'}[cage.status];

        let envHtml = '';
        if (envLogs.length > 0) {
            const items = envLogs.slice(0, 10).map(log => {
                return '<div class="env-log-item"><span class="env-log-time">' + Store.formatDateTime(log.timestamp) +
                    '</span><span class="env-temp" style="color:#E76F51;">🌡 ' + log.temperature.toFixed(1) + '°C</span>' +
                    '<span class="env-hum" style="color:#3B82F6;">💧 ' + log.humidity.toFixed(0) + '%</span></div>';
            }).join('');
            envHtml = '<div class="env-log-list">' + items + '</div>';
        } else {
            envHtml = '<p style="color:var(--color-text-light);">暂无历史记录</p>';
        }

        let disinfectHtml = '';
        const typeMap = {routine:'标准消毒',quick:'快速消毒',deep:'深度消毒'};
        if (disinfectLogs.length > 0) {
            const items = disinfectLogs.map(log => {
                const t = typeMap[log.type] || log.type;
                return '<div class="disinfect-log-item"><span>🛡️</span><span class="disinfect-type">' + t +
                    '</span><span class="disinfect-op">' + log.operator + '</span>' +
                    '<span class="disinfect-time">' + Store.formatDateTime(log.timestamp) + '</span></div>';
            }).join('');
            disinfectHtml = '<div class="disinfect-log-list">' + items + '</div>';
        } else {
            disinfectHtml = '<p style="color:var(--color-text-light);">暂无消毒记录</p>';
        }

        let orderHtml = '';
        if (order) {
            orderHtml = '<div class="detail-section"><h4>当前占用订单</h4>' +
                '<div class="order-mini-card" id="cageOrderLink" style="cursor:pointer;">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
                '<div><div style="font-weight:600;font-family:var(--font-serif);font-size:1.05rem;">' + order.order_no + '</div>' +
                '<div style="color:var(--color-text-light);font-size:0.85rem;margin-top:0.25rem;">' + order.pet_breed +
                ' · ' + order.pet_weight + 'kg · ' + order.origin + '→' + order.destination + '</div></div>' +
                '<span class="status-badge ' + order.status + '">' + Store.STATUS_LABELS[order.status] + '</span></div></div></div>';
        }

        let actions = [];
        if (order) actions.push('<button class="btn btn-secondary" id="viewOrderBtn">查看对应订单</button>');
        if (cage.status === 'cleaning') actions.push('<button class="btn btn-success" id="finishCleaningBtn">消毒完成并置为空闲</button>');
        if (cage.status === 'occupied') actions.push('<button class="btn btn-warning" id="markCleaningBtn">标记为待消毒</button>');
        if (cage.status === 'available') actions.push('<button class="btn btn-info" id="quickDisinfectBtn">快速消毒记录</button>');
        const actionsHtml = '<div class="modal-actions">' + actions.join('') + '</div>';

        return `
            <div class="detail-section">
                <div class="detail-header-row">
                    <h4>笼位概览</h4>
                    <span class="status-badge ${cage.status} large">${statusLabel}</span>
                </div>
                <div class="detail-info-grid">
                    <div class="detail-info-item"><div class="label">当前温度</div><div class="value" style="color:#E76F51;font-weight:700;">${cage.temperature.toFixed(1)}°C</div></div>
                    <div class="detail-info-item"><div class="label">当前湿度</div><div class="value" style="color:#3B82F6;font-weight:700;">${cage.humidity.toFixed(0)}%</div></div>
                    <div class="detail-info-item"><div class="label">上次消毒</div><div class="value">${Store.formatDateTime(cage.last_disinfected)}</div></div>
                    <div class="detail-info-item"><div class="label">消毒人</div><div class="value">${cage.disinfected_by || '-'}</div></div>
                </div>
            </div>
            ${orderHtml}
            <div class="detail-section">
                <h4>温湿度历史（最近20条）</h4>
                ${envHtml}
            </div>
            <div class="detail-section">
                <h4>消毒记录</h4>
                ${disinfectHtml}
            </div>
            ${actionsHtml}
        `;
    }

    function bindCageDetailEvents(cage, order) {
        const cageOrderLink = document.getElementById('cageOrderLink');
        if (cageOrderLink && order) {
            cageOrderLink.addEventListener('click', () => {
                closeModal();
                setTimeout(() => openOrderDetail(order.id), 150);
            });
        }
        const viewOrderBtn = document.getElementById('viewOrderBtn');
        if (viewOrderBtn && order) {
            viewOrderBtn.addEventListener('click', () => {
                closeModal();
                setTimeout(() => openOrderDetail(order.id), 150);
            });
        }

        const finishCleaningBtn = document.getElementById('finishCleaningBtn');
        if (finishCleaningBtn) {
            finishCleaningBtn.addEventListener('click', () => {
                const operator = document.getElementById('operatorName').value || Store.getOperator();
                CageManager.finishCleaning(cage.id, operator);
                showToast(`${cage.label} 消毒完成，已置为空闲`, 'success');
                closeModal();
                refreshAll();
            });
        }

        const markCleaningBtn = document.getElementById('markCleaningBtn');
        if (markCleaningBtn) {
            markCleaningBtn.addEventListener('click', () => {
                if (order && order.status !== 'delivered') {
                    if (!confirm('该笼位仍有订单使用中，确认标记为消毒中？订单已签收才会自动进入消毒流程。')) return;
                }
                const operator = document.getElementById('operatorName').value || Store.getOperator();
                CageManager.scheduleCleaning(cage.id, operator);
                showToast(`${cage.label} 已标记为消毒中`, 'warning');
                closeModal();
                refreshAll();
            });
        }

        const quickDisinfectBtn = document.getElementById('quickDisinfectBtn');
        if (quickDisinfectBtn) {
            quickDisinfectBtn.addEventListener('click', () => {
                const operator = document.getElementById('operatorName').value || Store.getOperator();
                CageManager.markDisinfected(cage.id, operator);
                showToast(`${cage.label} 已记录快速消毒`, 'info');
                closeModal();
                refreshAll();
            });
        }
    }

    function closeModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        MapView.destroy();
        currentModalType = null;
        currentCageId = null;
    }

    function advanceOrderStatus(orderId) {
        try {
            const operator = document.getElementById('operatorName').value || Store.getOperator();
            const oldOrder = OrderManager.getOrderById(orderId);
            const prevStatus = oldOrder.status;
            const order = OrderManager.advanceToNextStatus(orderId, operator);

            const msg = `状态已更新：「${Store.STATUS_LABELS[prevStatus]}」→「${Store.STATUS_LABELS[order.status]}」`;
            showToast(msg, 'success');
            refreshAll();

            if (currentModalType === 'order') {
                setTimeout(() => openOrderDetail(orderId), 150);
            }
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function setActiveTab(status) {
        currentTab = status;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === status);
        });
        renderOrderList();
    }

    function refreshAll() {
        renderStats();
        renderOrderList();
        renderCageGrid();
    }

    return {
        showToast,
        renderStats,
        renderOrderList,
        renderCageGrid,
        openOrderDetail,
        openCageDetail,
        closeModal,
        advanceOrderStatus,
        setActiveTab,
        refreshAll,
        get currentFilterDate() { return currentFilterDate; },
        set currentFilterDate(v) { currentFilterDate = v; },
        get currentFilterOrigin() { return currentFilterOrigin; },
        set currentFilterOrigin(v) { currentFilterOrigin = v; },
        get currentFilterDest() { return currentFilterDest; },
        set currentFilterDest(v) { currentFilterDest = v; },
        get currentTab() { return currentTab; }
    };
})();
