const OrderManager = (() => {
    function getAllOrders() {
        return Store.getOrders().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    function getOrderById(id) {
        return Store.getOrders().find(o => o.id === id);
    }

    function getOrdersByStatus(status) {
        const orders = status === 'all'
            ? getAllOrders()
            : Store.getOrders().filter(o => o.status === status);
        return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    function getOrdersByDate(dateStr) {
        if (!dateStr) return getAllOrders();
        return Store.getOrders()
            .filter(o => o.ship_date === dateStr)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    function filterOrders(options) {
        let orders = Store.getOrders();
        if (options.dateStr) {
            orders = orders.filter(o => o.ship_date === options.dateStr);
        }
        if (options.status && options.status !== 'all') {
            orders = orders.filter(o => o.status === options.status);
        }
        if (options.statuses && options.statuses.length > 0) {
            orders = orders.filter(o => options.statuses.includes(o.status));
        }
        if (options.origin && options.origin !== 'all') {
            orders = orders.filter(o => o.origin === options.origin);
        }
        if (options.destination && options.destination !== 'all') {
            orders = orders.filter(o => o.destination === options.destination);
        }
        if (options.todayOnly) {
            const today = Store.getToday();
            orders = orders.filter(o => o.ship_date === today);
        }
        if (options.pendingOrTransit) {
            orders = orders.filter(o =>
                ['pending', 'waiting_pickup', 'in_transit', 'arrived'].includes(o.status)
            );
        }
        return orders.sort((a, b) => {
            const idxA = Store.STATUS_FLOW.indexOf(a.status);
            const idxB = Store.STATUS_FLOW.indexOf(b.status);
            if (idxA !== idxB) return idxA - idxB;
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    function getOrdersByDateAndStatus(dateStr, status) {
        return filterOrders({ dateStr, status });
    }

    function getTodayOrdersByStatus(status) {
        const today = Store.getToday();
        return filterOrders({ dateStr: today, status });
    }

    function getTodayPendingAndTransit() {
        return filterOrders({
            todayOnly: true,
            statuses: ['pending', 'waiting_pickup', 'in_transit', 'arrived']
        });
    }

    function createOrder(data) {
        const cage = CageManager.assignCage();
        if (!cage) {
            throw new Error('没有可用的笼位，请稍后再试');
        }

        const cityCoords = Store.CITIES;
        const originCoords = cityCoords[data.origin];
        const destCoords = cityCoords[data.destination];

        if (!originCoords || !destCoords) {
            CageManager.releaseCage(cage.id);
            throw new Error('请选择有效的起运地和目的地');
        }

        if (data.origin === data.destination) {
            CageManager.releaseCage(cage.id);
            throw new Error('起运地和目的地不能相同');
        }

        const order = {
            id: Store.generateId('order'),
            order_no: Store.generateOrderNo(),
            pet_breed: data.pet_breed,
            pet_weight: parseFloat(data.pet_weight),
            vaccinated: !!data.vaccinated,
            origin: data.origin,
            destination: data.destination,
            origin_coords: JSON.stringify(originCoords),
            dest_coords: JSON.stringify(destCoords),
            ship_date: data.ship_date,
            cage_id: cage.id,
            cage_label: cage.label,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const orders = Store.getOrders();
        orders.push(order);
        Store.saveOrders(orders);

        addStatusLog(order.id, 'pending', '系统创建');

        return order;
    }

    function addStatusLog(orderId, status, operator) {
        const logs = Store.getStatusLogs();
        logs.push({
            id: Store.generateId('log'),
            order_id: orderId,
            status: status,
            timestamp: new Date().toISOString(),
            operator: operator || Store.getOperator()
        });
        Store.saveStatusLogs(logs);
    }

    function advanceToNextStatus(orderId, operator) {
        const order = getOrderById(orderId);
        if (!order) throw new Error('订单不存在');

        const nextStatus = getNextStatus(order.status);
        if (!nextStatus) {
            throw new Error('订单已完成，无法继续推进');
        }

        return updateOrderStatus(orderId, nextStatus, operator);
    }

    function updateOrderStatus(orderId, newStatus, operator) {
        const orders = Store.getOrders();
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx === -1) throw new Error('订单不存在');

        const currentStatus = orders[idx].status;
        const currentIdx = Store.STATUS_FLOW.indexOf(currentStatus);
        const newIdx = Store.STATUS_FLOW.indexOf(newStatus);

        if (newIdx === -1) {
            throw new Error('无效的目标状态');
        }

        if (newIdx <= currentIdx) {
            throw new Error('不能跳转到之前的状态，请按顺序推进');
        }

        if (newIdx !== currentIdx + 1) {
            throw new Error(`请按顺序推进状态，下一步应为「${Store.STATUS_LABELS[Store.STATUS_FLOW[currentIdx + 1]]}」`);
        }

        orders[idx].status = newStatus;
        Store.saveOrders(orders);

        addStatusLog(orderId, newStatus, operator);

        if (newStatus === 'delivered') {
            CageManager.scheduleCleaning(orders[idx].cage_id, operator);
        }

        return orders[idx];
    }

    function canAdvanceStatus(orderId) {
        const order = getOrderById(orderId);
        if (!order) return false;
        return Store.STATUS_FLOW.indexOf(order.status) < Store.STATUS_FLOW.length - 1;
    }

    function getNextStatus(currentStatus) {
        const idx = Store.STATUS_FLOW.indexOf(currentStatus);
        if (idx === -1 || idx >= Store.STATUS_FLOW.length - 1) return null;
        return Store.STATUS_FLOW[idx + 1];
    }

    function getStatusTimeline(orderId) {
        const order = getOrderById(orderId);
        if (!order) return [];
        const logs = Store.getStatusLogsByOrder(orderId);
        const result = Store.STATUS_FLOW.map((status, idx) => {
            const log = logs.find(l => l.status === status);
            return {
                status,
                label: Store.STATUS_LABELS[status],
                description: Store.STATUS_DESCRIPTIONS[status],
                completed: !!log,
                current: order.status === status,
                timestamp: log ? log.timestamp : null,
                operator: log ? log.operator : null,
                index: idx
            };
        });
        return result;
    }

    function getTransportProgress(orderId) {
        const order = getOrderById(orderId);
        if (!order) return null;

        const logs = Store.getStatusLogsByOrder(orderId);
        const inTransitLog = logs.find(l => l.status === 'in_transit');
        const arrivedLog = logs.find(l => l.status === 'arrived');

        let inTransitMs = 0;
        if (inTransitLog) {
            const start = new Date(inTransitLog.timestamp).getTime();
            const end = arrivedLog ? new Date(arrivedLog.timestamp).getTime() : Date.now();
            inTransitMs = end - start;
        }

        const eta = Store.getTransportETA(order.origin_coords, order.dest_coords, inTransitMs);
        return {
            order,
            eta,
            in_transit_since: inTransitLog ? inTransitLog.timestamp : null,
            arrived_at: arrivedLog ? arrivedLog.timestamp : null,
            current_status: order.status
        };
    }

    function addHealthLog(orderId, data, operator) {
        const logs = Store.getHealthLogs();
        const entry = {
            id: Store.generateId('health'),
            order_id: orderId,
            diet_status: data.diet_status,
            mental_status: data.mental_status,
            notes: data.notes || '',
            is_abnormal: !!data.is_abnormal,
            abnormal_type: data.abnormal_type || '',
            resolved: false,
            resolution: '',
            resolved_at: null,
            resolved_by: '',
            timestamp: new Date().toISOString(),
            operator: operator || Store.getOperator()
        };
        logs.push(entry);
        Store.saveHealthLogs(logs);
        return entry;
    }

    function resolveHealthLog(logId, resolution, operator) {
        return Store.resolveHealthLog(logId, resolution, operator);
    }

    function getAllUnresolvedAbnormalOrders() {
        return Store.getAllUnresolvedAbnormalOrders();
    }

    function hasUnresolvedAbnormal(orderId) {
        return Store.hasUnresolvedAbnormalHealth(orderId);
    }

    function getTransportNodes(orderId) {
        return Store.getTransportNodesByOrder(orderId);
    }

    function addTransportNode(orderId, nodeType, operator, notes) {
        return Store.addTransportNode(orderId, nodeType, operator, notes);
    }

    function removeTransportNode(nodeId) {
        Store.removeTransportNode(nodeId);
    }

    function getEffectiveProgress(orderId) {
        const base = getTransportProgress(orderId);
        const nodes = Store.getTransportNodesByOrder(orderId);
        let maxNodeProgress = 0;
        nodes.forEach(n => { if (n.progress > maxNodeProgress) maxNodeProgress = n.progress; });
        const baseProgress = (base && base.eta) ? base.eta.progress : 0;
        const finalProgress = Math.max(baseProgress, maxNodeProgress, (base && base.current_status === 'delivered') ? 1 : 0);
        return {
            ...(base || {}),
            nodes,
            effective_progress: finalProgress,
            node_progress: maxNodeProgress,
            base_progress: baseProgress
        };
    }

    function getDashboardData() {
        const today = Store.getToday();
        const todayOrders = filterOrders({ dateStr: today });
        const stats = getOrderStats();

        return {
            generated_at: new Date().toISOString(),
            today: {
                date: today,
                total: todayOrders.length,
                pending: stats.today_pending,
                waiting_pickup: stats.today_waiting,
                in_transit: stats.today_in_transit,
                arrived: stats.today_arrived
            },
            cards: {
                today_pending: filterOrders({ dateStr: today, status: 'pending' }),
                today_waiting_pickup: filterOrders({ dateStr: today, status: 'waiting_pickup' }),
                today_in_transit: filterOrders({ dateStr: today, status: 'in_transit' }),
                today_arrived: filterOrders({ dateStr: today, status: 'arrived' }),
                cages_cleaning: CageManager.getCleaningCages(),
                abnormal_orders: getAllUnresolvedAbnormalOrders()
            },
            disinfect_stats: Store.getDisinfectStatsByOperator(7)
        };
    }

    function getOrderStats() {
        const orders = Store.getOrders();
        const today = Store.getToday();
        const todayOrders = orders.filter(o => o.ship_date === today);
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            waiting_pickup: orders.filter(o => o.status === 'waiting_pickup').length,
            in_transit: orders.filter(o => o.status === 'in_transit').length,
            arrived: orders.filter(o => o.status === 'arrived').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            today_total: todayOrders.length,
            today_pending: todayOrders.filter(o => o.status === 'pending').length,
            today_waiting: todayOrders.filter(o => o.status === 'waiting_pickup').length,
            today_in_transit: todayOrders.filter(o => o.status === 'in_transit').length,
            today_arrived: todayOrders.filter(o => o.status === 'arrived').length,
            today_pending_all: todayOrders.filter(o =>
                ['pending', 'waiting_pickup'].includes(o.status)
            ).length,
            today_transit: todayOrders.filter(o => o.status === 'in_transit').length
        };
    }

    function getAvailableOrigins() {
        const set = new Set(Store.getOrders().map(o => o.origin));
        return Array.from(set).sort();
    }

    function getAvailableDestinations() {
        const set = new Set(Store.getOrders().map(o => o.destination));
        return Array.from(set).sort();
    }

    return {
        getAllOrders,
        getOrderById,
        getOrdersByStatus,
        getOrdersByDate,
        getOrdersByDateAndStatus,
        getTodayOrdersByStatus,
        getTodayPendingAndTransit,
        filterOrders,
        createOrder,
        updateOrderStatus,
        advanceToNextStatus,
        canAdvanceStatus,
        getNextStatus,
        getStatusTimeline,
        getTransportProgress,
        addHealthLog,
        resolveHealthLog,
        getAllUnresolvedAbnormalOrders,
        hasUnresolvedAbnormal,
        getTransportNodes,
        addTransportNode,
        removeTransportNode,
        getEffectiveProgress,
        getDashboardData,
        getOrderStats,
        getAvailableOrigins,
        getAvailableDestinations
    };
})();
