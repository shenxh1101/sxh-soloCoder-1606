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

    function getOrdersByDateAndStatus(dateStr, status) {
        let orders = Store.getOrders();
        if (dateStr) {
            orders = orders.filter(o => o.ship_date === dateStr);
        }
        if (status && status !== 'all') {
            orders = orders.filter(o => o.status === status);
        }
        return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    function getTodayOrdersByStatus(status) {
        const today = Store.getToday();
        let orders = Store.getOrders().filter(o => o.ship_date === today);
        if (status && status !== 'all') {
            orders = orders.filter(o => o.status === status);
        }
        return orders;
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

    function updateOrderStatus(orderId, newStatus, operator) {
        const orders = Store.getOrders();
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx === -1) throw new Error('订单不存在');

        const currentStatus = orders[idx].status;
        const currentIdx = Store.STATUS_FLOW.indexOf(currentStatus);
        const newIdx = Store.STATUS_FLOW.indexOf(newStatus);

        if (newIdx <= currentIdx) {
            throw new Error('不能跳转到之前的状态');
        }

        if (newIdx !== currentIdx + 1) {
            throw new Error('请按顺序更新状态');
        }

        orders[idx].status = newStatus;
        Store.saveOrders(orders);

        addStatusLog(orderId, newStatus, operator);

        if (newStatus === 'delivered') {
            CageManager.releaseCage(orders[idx].cage_id);
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

    function addHealthLog(orderId, data, operator) {
        const logs = Store.getHealthLogs();
        logs.push({
            id: Store.generateId('health'),
            order_id: orderId,
            diet_status: data.diet_status,
            mental_status: data.mental_status,
            notes: data.notes || '',
            timestamp: new Date().toISOString(),
            operator: operator || Store.getOperator()
        });
        Store.saveHealthLogs(logs);
        return logs[logs.length - 1];
    }

    function getOrderStats() {
        const orders = Store.getOrders();
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            waiting_pickup: orders.filter(o => o.status === 'waiting_pickup').length,
            in_transit: orders.filter(o => o.status === 'in_transit').length,
            arrived: orders.filter(o => o.status === 'arrived').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            today_pending: getTodayOrdersByStatus('pending').length + getTodayOrdersByStatus('waiting_pickup').length,
            today_transit: getTodayOrdersByStatus('in_transit').length
        };
    }

    return {
        getAllOrders,
        getOrderById,
        getOrdersByStatus,
        getOrdersByDate,
        getOrdersByDateAndStatus,
        getTodayOrdersByStatus,
        createOrder,
        updateOrderStatus,
        canAdvanceStatus,
        getNextStatus,
        addHealthLog,
        getOrderStats
    };
})();
