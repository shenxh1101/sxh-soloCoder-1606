(function () {
    document.addEventListener('DOMContentLoaded', function () {
        Store.initializeCages();
        Store.initializeMockData();

        const savedOperator = Store.getOperator();
        if (savedOperator) {
            document.getElementById('operatorName').value = savedOperator;
        }

        document.getElementById('shipDate').value = Store.getToday();

        UI.renderStats();
        UI.renderOrderList();
        UI.renderCageGrid();

        document.getElementById('orderForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const origin = document.getElementById('origin').value;
            const destination = document.getElementById('destination').value;

            if (origin === destination) {
                UI.showToast('起运地和目的地不能相同', 'error');
                return;
            }

            try {
                const operator = document.getElementById('operatorName').value || Store.getOperator();
                Store.setOperator(operator);

                const order = OrderManager.createOrder({
                    pet_breed: document.getElementById('petBreed').value.trim(),
                    pet_weight: document.getElementById('petWeight').value,
                    vaccinated: document.getElementById('vaccinated').checked,
                    origin: origin,
                    destination: destination,
                    ship_date: document.getElementById('shipDate').value
                });

                UI.showToast(`订单创建成功！已分配 ${order.cage_label}`, 'success');
                UI.refreshAll();

                document.getElementById('orderForm').reset();
                document.getElementById('shipDate').value = Store.getToday();
            } catch (err) {
                UI.showToast(err.message, 'error');
            }
        });

        document.getElementById('operatorName').addEventListener('change', function () {
            Store.setOperator(this.value || Store.getOperator());
        });

        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                UI.setActiveTab(this.dataset.status);
            });
        });

        document.getElementById('filterDate').addEventListener('change', function () {
            UI.setFilterDate(this.value);
        });

        document.getElementById('clearFilterBtn').addEventListener('click', function () {
            document.getElementById('filterDate').value = '';
            UI.setFilterDate('');
        });

        document.getElementById('modalCloseBtn').addEventListener('click', function () {
            UI.closeModal();
        });

        document.getElementById('modalOverlay').addEventListener('click', function (e) {
            if (e.target === this) {
                UI.closeModal();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                UI.closeModal();
            }
        });

        setInterval(function () {
            CageManager.simulateEnvironmentUpdate();
            UI.renderCageGrid();
        }, 30000);

        console.log('安心宠物托运管理系统已启动');
    });
})();
