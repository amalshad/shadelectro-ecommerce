import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';


// CSV Generation Function
async function generateCSV(res, data, summary, fileName) {
    try {
        // Define CSV fields
        const fields = [
            'orderId',
            'customerName',
            'customerEmail',
            'customerPhone',
            'orderDate',
            'orderTime',
            'paymentMethod',
            'paymentStatus',
            'orderStatus',
            'subtotal',
            'discount',
            'shipping',
            'finalAmount',
            'itemsCount',
            'items'
        ];

        // Configure CSV parser
        const json2csvParser = new Parser({
            fields,
            header: true,
            delimiter: ',',
            quote: '"',
            escapedQuote: '""'
        });

        // Convert to CSV
        const csv = json2csvParser.parse(data);

        // Add summary header
        const summaryHeader = [
            '# ShadElectro - Sales Ledger Report',
            `# Period: ${summary.period}`,
            `# Generated on: ${summary.generatedOn}`,
            `# Total Orders: ${summary.totalOrders}`,
            `# Total Revenue: Rs.${summary.totalRevenue.toLocaleString('en-IN')}`,
            `# Total Discounts: Rs.${summary.totalDiscount.toLocaleString('en-IN')}`,
            `# Total Shipping: Rs.${summary.totalShipping.toLocaleString('en-IN')}`,
            '',
            ''
        ].join('\n');

        const finalCSV = summaryHeader + csv;

        // Set response headers
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);

        res.send(finalCSV);
    } catch (error) {
        console.error('CSV generation error:', error);
        throw error;
    }
}


// PDF Generation Function
async function generatePDF(res, data, summary, fileName) {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
            Title: 'Ledger Book - ShadElectro',
            Author: 'ShadElectro Admin',
            Subject: 'Sales Ledger Report'
        }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);

    // Pipe the PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#8a2be2').text('ShadElectro', 50, 50);
    doc.fontSize(18).fillColor('#000000').text('Sales Ledger Book', 50, 80);
    doc.fontSize(12).text(`Period: ${summary.period}`, 50, 110);
    doc.text(`Generated on: ${summary.generatedOn}`, 50, 130);

    // Summary Box
    doc.rect(50, 160, 500, 120).strokeColor('#8a2be2').stroke();
    doc.fontSize(14).fillColor('#8a2be2').text('Summary', 60, 170);

    doc.fontSize(11).fillColor('#000000')
        .text(`Total Orders: ${summary.totalOrders}`, 60, 195)
        .text(`Total Revenue: Rs.${summary.totalRevenue.toLocaleString('en-IN')}`, 60, 215)
        .text(`Total Discounts: Rs.${summary.totalDiscount.toLocaleString('en-IN')}`, 60, 235)
        .text(`Total Shipping: Rs.${summary.totalShipping.toLocaleString('en-IN')}`, 60, 255);

    // Table Header
    let y = 320;
    doc.fontSize(10).fillColor('#8a2be2');
    doc.text('Order ID', 50, y);
    doc.text('Customer', 120, y);
    doc.text('Date', 220, y);
    doc.text('Payment', 280, y);
    doc.text('Status', 340, y);
    doc.text('Amount', 400, y);
    doc.text('Items', 460, y);

    // Draw header line
    doc.strokeColor('#8a2be2').moveTo(50, y + 15).lineTo(550, y + 15).stroke();

    y += 25;
    doc.fontSize(9).fillColor('#000000');

    // Table Data
    data.forEach((order, index) => {
        if (y > 750) {
            doc.addPage();
            y = 50;

            // Repeat header on new page
            doc.fontSize(10).fillColor('#8a2be2');
            doc.text('Order ID', 50, y);
            doc.text('Customer', 120, y);
            doc.text('Date', 220, y);
            doc.text('Payment', 280, y);
            doc.text('Status', 340, y);
            doc.text('Amount', 400, y);
            doc.text('Items', 460, y);

            doc.strokeColor('#8a2be2').moveTo(50, y + 15).lineTo(550, y + 15).stroke();
            y += 25;
            doc.fontSize(9).fillColor('#000000');
        }

        doc.text(order.orderId, 50, y);
        doc.text(order.customerName.substring(0, 12), 120, y);
        doc.text(order.orderDate, 220, y);
        doc.text(order.paymentMethod.toUpperCase(), 280, y);
        doc.text(order.orderStatus, 340, y);
        doc.text(`Rs.${order.finalAmount.toLocaleString('en-IN')}`, 400, y);
        doc.text(order.itemsCount.toString(), 460, y);

        y += 20;

        // Add separator line every 5 rows
        if ((index + 1) % 5 === 0) {
            doc.strokeColor('#e0e0e0').moveTo(50, y).lineTo(550, y).stroke();
            y += 5;
        }
    });

    // Footer
    doc.fontSize(8).fillColor('#666666')
        .text(`Generated by ShadElectro Admin Panel on ${new Date().toLocaleString('en-IN')}`, 50, doc.page.height - 50);

    doc.end();
}

// Excel Generation Function
async function generateExcel(res, data, summary, fileName) {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'ShadElectro Admin';
    workbook.lastModifiedBy = 'ShadElectro Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create summary worksheet
    const summarySheet = workbook.addWorksheet('Summary', {
        headerFooter: { firstHeader: 'ShadElectro - Sales Ledger Summary' }
    });

    // Summary styling
    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = 'ShadElectro - Sales Ledger Summary';
    summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '8a2be2' } };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    summarySheet.addRow([]);
    summarySheet.addRow(['Period:', summary.period]);
    summarySheet.addRow(['Generated On:', summary.generatedOn]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Orders:', summary.totalOrders]);
    summarySheet.addRow(['Total Revenue:', `Rs.${summary.totalRevenue.toLocaleString('en-IN')}`]);
    summarySheet.addRow(['Total Discounts:', `Rs.${summary.totalDiscount.toLocaleString('en-IN')}`]);
    summarySheet.addRow(['Total Shipping:', `Rs.${summary.totalShipping.toLocaleString('en-IN')}`]);

    // Create detailed data worksheet
    const dataSheet = workbook.addWorksheet('Detailed Orders');

    // Define columns
    dataSheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Email', key: 'customerEmail', width: 25 },
        { header: 'Phone', key: 'customerPhone', width: 15 },
        { header: 'Order Date', key: 'orderDate', width: 12 },
        { header: 'Order Time', key: 'orderTime', width: 12 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Order Status', key: 'orderStatus', width: 15 },
        { header: 'Subtotal', key: 'subtotal', width: 12 },
        { header: 'Discount', key: 'discount', width: 12 },
        { header: 'Shipping', key: 'shippingPrice', width: 12 },
        { header: 'Final Amount', key: 'finalAmount', width: 15 },
        { header: 'Items Count', key: 'itemsCount', width: 12 },
        { header: 'Items Details', key: 'items', width: 40 }
    ];

    // Style header row
    dataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8a2be2' } };
    dataSheet.getRow(1).alignment = { horizontal: 'center' };

    // Add data rows
    data.forEach((order) => {
        dataSheet.addRow({
            orderId: order.orderId,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            orderDate: order.orderDate,
            orderTime: order.orderTime,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            subtotal: order.subtotal,
            discount: order.discount,
            shipping: order.shippingPrice,
            finalAmount: order.finalAmount,
            itemsCount: order.itemsCount,
            items: order.items
        });
    });

    // Auto-fit columns
    dataSheet.columns.forEach(column => {
        if (column.width < 10) column.width = 10;
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
}


export { generateCSV, generateExcel, generatePDF }