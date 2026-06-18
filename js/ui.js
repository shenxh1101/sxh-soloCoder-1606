const UI = (() => {
    let currentTab = 'all';
    let currentFilterDate = '';

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
        }, 3000);
    }

    function renderStats() {
        const orderStats = OrderManager.getOrderStats();
        const cageStats = CageManager.getCageStats();

        const statsBar = document.getElementById('statsBar');
        statsBar.innerHTML = `
            <div class="stat-card stat-pending">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="stat-info">
                    <h3>今日待处理</h3>
                    <div class="stat-value">${orderStats.today_pending}</div>
                </div>
            </div>
            <div class="stat-card stat-transit">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                </div>
                <div class="stat-info">
                    <h3>运输中订单</h3>
                    <div class="stat-value">${orderStats.today_transit}<small> 单</small></div>
                </div>
            </div>
            <div class="stat-card stat-delivered">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="stat-info">
                    <h3>已完成订单</h3>
                    <div class="stat-value">${orderStats.delivered}<small> 单</small></div>
                </div>
            </div>
            <div class="stat-card stat-cages">
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </div>
                <div class="stat-info">
                    <h3>笼位使用率</h3>
                    <div class="stat-value">${cageStats.occupancyRate}<small>%</small></div>
                </div>
            </div>
        `;
    }

    function renderOrderList() {
        const orders = OrderManager.getOrdersByDateAndStatus(currentFilterDate, currentTab);
        const listEl = document.getElementById('orderList');

        if (orders.length === 0) {
            listEl.innerHTML = `
                <div class="order-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>暂无订单数据</p>
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
        const nextStatusLabel = nextStatus ? Store.STATUS_LABELS[nextStatus] : null;
        const canAdvance = OrderManager.canAdvanceStatus(order.id);

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <span class="order-id">${order.order_no}</span>
                    <span class="status-badge ${order.status}">${Store.STATUS_LABELS[order.status]}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-info-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.17C12 5.17 8.5 2 4.5 4.5C2 7 2.5 11 6 13.5C8.5 15.5 11 14.5 12 13C13 14.5 15.5 15.5 18 13.5C21.5 11 22 7 19.5 4.5C15.5 2 12 5.17 12 5.17Z"/></svg>
                        <strong>${order.pet_breed}</strong> · ${order.pet_weight}kg
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
                <div class="order-card-footer">
                    <span style="font-size:0.8rem;color:var(--color-text-light)">${Store.formatDateTime(order.created_at)}</span>
                    <div class="order-actions">
                        <button class="btn btn-sm btn-secondary" data-action="detail" data-order-id="${order.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            详情
                        </button>
                        ${canAdvance && nextStatus ? `
                            <button class="btn btn-sm btn-primary" data-action="advance" data-order-id="${order.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                ${nextStatusLabel}
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

            return `
                <div class="cage-cell ${cage.status}" data-cage-id="${cage.id}" title="${order ? `占用: ${order.pet_breed} (${order.order_no})` : (cage.status === 'cleaning' ? '消毒中' : '空闲')}">
                    <div class="cage-label">${cage.label}</div>
                    <div class="cage-env">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/></svg>
                            ${cage.temperature.toFixed(1)}°C
                        </span>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                            ${cage.humidity.toFixed(0)}%
                        </span>
                    </div>
                    <div class="cage-disinfect">${disinfectDays}天前消毒</div>
                </div>
            `;
        }).join('');

        gridEl.querySelectorAll('.cage-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const cageId = cell.dataset.cageId;
                const cage = CageManager.getCageById(cageId);
                const order = cage.status === 'occupied' ? CageManager.getOrderByCage(cageId) : null;

                if (order) {
                    openOrderDetail(order.id);
                } else if (cage.status === 'cleaning') {
                    if (confirm(`笼位 ${cage.label} 是否消毒完成？`)) {
                        const operator = document.getElementById('operatorName').value || Store.getOperator();
                        CageManager.finishCleaning(cageId);
                        CageManager.markDisinfected(cageId, operator);
                        refreshAll();
                        showToast(`${cage.label} 消毒完成，已标记为可用`, 'success');
                    }
                } else {
                    showToast(`${cage.label} 当前空闲，温度${cage.temperature.toFixed(1)}°C，湿度${cage.humidity.toFixed(0)}%`, 'info');
                }
            });
        });
    }

    function openOrderDetail(orderId) {
        const order = OrderManager.getOrderById(orderId);
        if (!order) {
            showToast('订单不存在', 'error');
            return;
        }

        const statusLogs = Store.getStatusLogsByOrder(orderId);
        const healthLogs = Store.getHealthLogsByOrder(orderId);
        const nextStatus = OrderManager.getNextStatus(order.status);
        const canAdvance = OrderManager.canAdvanceStatus(orderId);

        document.getElementById('modalTitle').textContent = `订单详情 - ${order.order_no}`;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="detail-section">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.17C12 5.17 8.5 2 4.5 4.5C2 7 2.5 11 6 13.5C8.5 15.5 11 14.5 12 13C13 14.5 15.5 15.5 18 13.5C21.5 11 22 7 19.5 4.5C15.5 2 12 5.17 12 5.17Z"/></svg>
                    宠物信息
                </h4>
                <div class="detail-info-grid">
                    <div class="detail-info-item">
                        <div class="label">品种</div>
                        <div class="value">${order.pet_breed}</div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">体重</div>
                        <div class="value">${order.pet_weight} kg</div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">疫苗接种</div>
                        <div class="value">${order.vaccinated ? '<span style="color:var(--color-success)">✓ 已接种</span>' : '<span style="color:var(--color-warning)">✗ 未接种</span>'}</div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">分配笼位</div>
                        <div class="value"><span class="status-badge occupied">${order.cage_label || order.cage_id}</span></div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    运输路线
                </h4>
                <div class="detail-info-grid">
                    <div class="detail-info-item">
                        <div class="label">起运地</div>
                        <div class="value">${order.origin}</div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">目的地</div>
                        <div class="value">${order.destination}</div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">托运日期</div>
                        <div class="value">${order.ship_date}</div>
                    </div>
                    <div class="detail-info-item">
                        <div class="label">当前状态</div>
                        <div class="value"><span class="status-badge ${order.status}">${Store.STATUS_LABELS[order.status]}</span></div>
                    </div>
                </div>
                <div id="mapContainer" class="map-container" style="margin-top:1rem;"></div>
            </div>

            <div class="detail-section">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    状态变更记录
                </h4>
                <div class="timeline">
                    ${statusLogs.map((log, idx) => `
                        <div class="timeline-item ${idx < statusLogs.length - 1 || order.status === 'delivered' ? 'completed' : ''}">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <div class="timeline-status">${Store.STATUS_LABELS[log.status]}</div>
                                <div class="timeline-meta">
                                    ${Store.formatDateTime(log.timestamp)} · 操作人: ${log.operator || '-'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="detail-section">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    宠物健康记录
                </h4>
                ${healthLogs.length > 0 ? healthLogs.map(log => `
                    <div class="health-record">
                        <div class="health-record-meta">${Store.formatDateTime(log.timestamp)} · 记录人: ${log.operator || '-'}</div>
                        <div class="health-record-body">
                            <div><strong>饮食:</strong> ${log.diet_status || '-'}</div>
                            <div><strong>精神:</strong> ${log.mental_status || '-'}</div>
                            ${log.notes ? `<div style="grid-column: span 2;"><strong>备注:</strong> ${log.notes}</div>` : ''}
                        </div>
                    </div>
                `).join('') : '<p style="color:var(--color-text-light);font-size:0.9rem">暂无健康记录</p>'}

                ${order.status !== 'delivered' && order.status !== 'pending' ? `
                    <form class="health-form" id="healthForm">
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
                        <button type="submit" class="btn btn-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            添加记录
                        </button>
                    </form>
                ` : ''}
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

        document.getElementById('modalOverlay').style.display = 'flex';

        setTimeout(() => {
            MapView.init('mapContainer');
            MapView.showRoute(order.origin_coords, order.dest_coords, order.origin, order.destination);
        }, 100);

        const healthForm = document.getElementById('healthForm');
        if (healthForm) {
            healthForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const operator = document.getElementById('operatorName').value || Store.getOperator();
                OrderManager.addHealthLog(orderId, {
                    diet_status: document.getElementById('dietStatus').value,
                    mental_status: document.getElementById('mentalStatus').value,
                    notes: ''
                }, operator);
                showToast('健康记录已添加', 'success');
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
                if (OrderManager.getOrderById(orderId).status === 'delivered') {
                    closeModal();
                } else {
                    openOrderDetail(orderId);
                }
            });
        }
    }

    function closeModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        MapView.destroy();
    }

    function advanceOrderStatus(orderId) {
        try {
            const operator = document.getElementById('operatorName').value || Store.getOperator();
            const order = OrderManager.updateOrderStatus(orderId, null, operator);
            showToast(`订单状态已更新为「${Store.STATUS_LABELS[order.status]}」`, 'success');
            refreshAll();
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

    function setFilterDate(dateStr) {
        currentFilterDate = dateStr;
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
        closeModal,
        advanceOrderStatus,
        setActiveTab,
        setFilterDate,
        refreshAll
    };
})();
