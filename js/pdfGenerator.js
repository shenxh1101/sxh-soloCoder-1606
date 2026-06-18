const PdfGenerator = (() => {
    function generateShippingOrder(order) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        let yPos = 20;

        doc.setFillColor(45, 106, 79);
        doc.rect(0, 0, pageWidth, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Pet Shipping Order', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('安心宠物托运 - 专业宠物运输服务', pageWidth / 2, yPos, { align: 'center' });

        yPos = 45;
        doc.setTextColor(0, 0, 0);

        doc.setFillColor(240, 245, 242);
        doc.rect(15, 40, pageWidth - 30, 20, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 106, 79);
        doc.text('Order No / 订单号:', 25, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(order.order_no || '-', 85, yPos);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Created / 创建时间: ' + Store.formatDateTime(order.created_at), 150, yPos);

        yPos = 70;
        drawSectionHeader(doc, 'Pet Information / 宠物信息', yPos);
        yPos += 12;

        drawInfoRow(doc, 'Breed / 品种', order.pet_breed || '-', yPos);
        yPos += 8;
        drawInfoRow(doc, 'Weight / 体重', (order.pet_weight || '-') + ' kg', yPos);
        yPos += 8;
        drawInfoRow(doc, 'Vaccinated / 疫苗接种', order.vaccinated ? 'Yes / 已接种' : 'No / 未接种', yPos);
        yPos += 8;
        drawInfoRow(doc, 'Cage No / 笼位号', order.cage_label || order.cage_id || '-', yPos);

        yPos += 10;
        drawSectionHeader(doc, 'Shipping Route / 运输路线', yPos);
        yPos += 12;

        doc.setFillColor(245, 245, 245);
        doc.rect(25, yPos - 5, pageWidth - 50, 28, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 106, 79);
        doc.text('FROM / 起运地', 35, yPos + 3);
        doc.text('TO / 目的地', pageWidth - 90, yPos + 3);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(order.origin || '-', 35, yPos + 15);
        doc.text(order.destination || '-', pageWidth - 90, yPos + 15);

        doc.setDrawColor(45, 106, 79);
        doc.setLineWidth(0.5);
        doc.line(85, yPos + 10, pageWidth - 100, yPos + 10);

        doc.setFillColor(231, 111, 81);
        doc.circle((85 + pageWidth - 100) / 2, yPos + 10, 2, 'F');

        yPos += 40;
        drawSectionHeader(doc, 'Shipping Details / 托运详情', yPos);
        yPos += 12;

        drawInfoRow(doc, 'Ship Date / 托运日期', order.ship_date || '-', yPos);
        yPos += 8;
        drawInfoRow(doc, 'Status / 当前状态', Store.STATUS_LABELS[order.status] || order.status || '-', yPos);

        yPos += 12;
        const statusLogs = Store.getStatusLogsByOrder(order.id);
        if (statusLogs.length > 0) {
            drawSectionHeader(doc, 'Status History / 状态记录', yPos);
            yPos += 12;

            statusLogs.forEach((log, index) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = 25;
                }
                const statusName = Store.STATUS_LABELS[log.status] || log.status;
                const statusText = `${index + 1}. ${statusName} - ${Store.formatDateTime(log.timestamp)}`;
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                doc.text(statusText, 25, yPos);
                yPos += 7;
                doc.setFontSize(9);
                doc.setTextColor(120, 120, 120);
                doc.text(`     Operator / 操作人: ${log.operator || '-'}`, 25, yPos);
                yPos += 8;
            });
        }

        const healthLogs = Store.getHealthLogsByOrder(order.id);
        if (healthLogs.length > 0) {
            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = 25;
            }
            yPos += 5;
            drawSectionHeader(doc, 'Health Records / 健康记录', yPos);
            yPos += 12;

            healthLogs.slice(0, 3).forEach((log) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = 25;
                }
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                doc.text(Store.formatDateTime(log.timestamp), 25, yPos);
                yPos += 7;
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`  Diet / 饮食: ${log.diet_status || '-'}`, 25, yPos);
                yPos += 6;
                doc.text(`  Mental / 精神: ${log.mental_status || '-'}`, 25, yPos);
                if (log.notes) {
                    yPos += 6;
                    doc.text(`  Notes / 备注: ${log.notes}`, 25, yPos);
                }
                yPos += 10;
            });
        }

        doc.setPage(doc.internal.getNumberOfPages());
        yPos = pageHeight - 35;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('安心宠物托运管理系统 - Generated by Pet Shipping System', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.text('Page / 页 ' + doc.internal.getNumberOfPages(), pageWidth / 2, yPos, { align: 'center' });

        const fileName = `shipping_order_${order.order_no || order.id}.pdf`;
        doc.save(fileName);
    }

    function drawSectionHeader(doc, title, y) {
        doc.setDrawColor(45, 106, 79);
        doc.setLineWidth(1.5);
        doc.line(20, y - 5, 20, y + 5);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 106, 79);
        doc.text(title, 30, y);

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(30, y + 4, doc.internal.pageSize.getWidth() - 20, y + 4);
    }

    function drawInfoRow(doc, label, value, y) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(label, 25, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(value, 90, y);
    }

    return {
        generateShippingOrder
    };
})();
