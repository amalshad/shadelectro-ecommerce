import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Parser } from "json2csv";


async function exportToCSV(res, data, metrics, filename) {
    try {
        // 1️⃣ Add new fields for Cancelled and Returned amounts
        const fields = [
            'Sr. No.',
            'Order ID',
            'Customer Name',
            'Customer Email',
            'Order Date',
            'Payment Method',
            'Payment Status',
            'Order Status',
            'Total Amount',
            'Discount',
            'Shipping',
            'Final Amount',
            'Cancelled Amount',
            'Returned Amount',
            'Items Count'
        ];

        // 2️⃣ Parse CSV from data
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        // 3️⃣ Add new summary lines for cancelled & returned totals
        const summary = [
            '# ShadElectro Sales Report',
            `# Generated on: ${new Date().toLocaleDateString('en-IN')}`,
            `# Total Orders: ${metrics.totalOrders}`,
            `# Total Revenue: Rs.${metrics.totalRevenue.toLocaleString('en-IN')}`,
            `# Total Discounts: Rs.${metrics.totalDiscount.toLocaleString('en-IN')}`,
            `# Total Cancelled Amount: Rs.${(metrics.totalCancelledAmount || 0).toLocaleString('en-IN')}`,
            `# Total Returned Amount: Rs.${(metrics.totalReturnedAmount || 0).toLocaleString('en-IN')}`,
            `# Net Revenue: Rs.${metrics.netRevenue.toLocaleString('en-IN')}`,
            '',
            ''
        ].join('\n');

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(summary + csv);
    } catch (error) {
        throw error;
    }
}



async function exportToExcel(res, data, metrics, filename, period) {
    try {
        const workbook = new ExcelJS.Workbook();


        workbook.creator = 'ShadElectro Admin';
        workbook.lastModifiedBy = 'ShadElectro Admin';
        workbook.created = new Date();
        workbook.modified = new Date();


        const summarySheet = workbook.addWorksheet('Summary');


        summarySheet.mergeCells('A1:D1');
        summarySheet.getCell('A1').value = 'ShadElectro - Sales Report Summary';
        summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '8a2be2' } };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };

        summarySheet.addRow([]);
        summarySheet.addRow(['Report Period:', period.toUpperCase()]);
        summarySheet.addRow(['Generated On:', new Date().toLocaleDateString('en-IN')]);
        summarySheet.addRow([]);
        summarySheet.addRow(['Total Orders:', metrics.totalOrders]);
        summarySheet.addRow(['Total Revenue:', `Rs.${metrics.totalRevenue.toLocaleString('en-IN')}`]);
        summarySheet.addRow(['Total Discounts:', `Rs.${metrics.totalDiscount.toLocaleString('en-IN')}`]);
        summarySheet.addRow(['Net Revenue:', `Rs.${metrics.netRevenue.toLocaleString('en-IN')}`]);
        summarySheet.addRow(['Average Order Value:', `Rs.${metrics.averageOrderValue.toFixed(2)}`]);
        summarySheet.addRow(['Coupon Usage Rate:', `${metrics.couponUsageRate}%`]);


        const dataSheet = workbook.addWorksheet('Orders Details');


        dataSheet.columns = [
            { header: 'Sr. No.', key: 'Sr. No.', width: 8 },
            { header: 'Order ID', key: 'Order ID', width: 18 },
            { header: 'Customer Name', key: 'Customer Name', width: 25 },
            { header: 'Customer Email', key: 'Customer Email', width: 30 },
            { header: 'Order Date', key: 'Order Date', width: 15 },
            { header: 'Payment Method', key: 'Payment Method', width: 18 },
            { header: 'Payment Status', key: 'Payment Status', width: 18 },
            { header: 'Order Status', key: 'Order Status', width: 15 },
            { header: 'Total Amount', key: 'Total Amount', width: 15 },
            { header: 'Discount', key: 'Discount', width: 12 },
            { header: 'Shipping', key: 'Shipping', width: 12 },
            { header: 'Final Amount', key: 'Final Amount', width: 15 },
            { header: 'Items Count', key: 'Items Count', width: 12 }
        ];


        dataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8a2be2' } };
        dataSheet.getRow(1).alignment = { horizontal: 'center' };


        data.forEach(row => {
            dataSheet.addRow(row);
        });


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        throw error;
    }
}


async function exportToPDF(res, data, metrics, filename, period) {
    try {
        const doc = new PDFDocument({
            size: "A4",
            margin: 40,
            info: {
                Title: "Sales Report - ShadElectro",
                Author: "ShadElectro Admin",
                Subject: "Sales Report",
            },
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.pdf"`
        );

        doc.pipe(res);

        doc.fontSize(20).fillColor("#8a2be2").text("ShadElectro", 40, 40);
        doc.fontSize(16).fillColor("#000000").text("Sales Report", 40, 70);
        doc.fontSize(12).text(`Period: ${period.toUpperCase()}`, 40, 95);
        doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 40, 115);

        doc.rect(40, 140, 520, 100).strokeColor("#8a2be2").stroke();
        doc.fontSize(14).fillColor("#8a2be2").text("Summary", 50, 150);

        doc
            .fontSize(10)
            .fillColor("#000000")
            .text(`Total Orders: ${metrics.totalOrders}`, 50, 175)
            .text(`Total Revenue: Rs.${metrics.totalRevenue.toLocaleString("en-IN")}`, 50, 190)
            .text(`Total Discounts: Rs.${metrics.totalDiscount.toLocaleString("en-IN")}`, 50, 205)
            .text(`Net Revenue: Rs.${metrics.netRevenue.toLocaleString("en-IN")}`, 300, 175
            )
            .text(
                `Average Order Value: Rs.${metrics.averageOrderValue.toFixed(2)}`,
                300,
                190
            )
            .text(`Coupon Usage Rate: ${metrics.couponUsageRate}%`, 300, 205);


        let y = 270;
        doc.fontSize(9).fillColor("#8a2be2");

        doc.text("Order ID", 40, y);
        doc.text("Customer", 100, y);
        doc.text("Date", 190, y);
        doc.text("Amount", 250, y);
        doc.text("Discount", 310, y);
        doc.text("Cancelled", 370, y);
        doc.text("Returned", 440, y);
        doc.text("Final", 510, y);
        doc.text("Status", 560, y);

        doc.strokeColor("#8a2be2").moveTo(40, y + 15).lineTo(580, y + 15).stroke();

        y += 25;
        doc.fontSize(8).fillColor("#000000");

        data.forEach((row, index) => {
            // Add new page if needed
            if (y > 750) {
                doc.addPage();
                y = 50;

                // Reprint header on new page
                doc.fontSize(9).fillColor("#8a2be2");
                doc.text("Order ID", 40, y);
                doc.text("Customer", 100, y);
                doc.text("Date", 190, y);
                doc.text("Amount", 250, y);
                doc.text("Discount", 310, y);
                doc.text("Cancelled", 370, y);
                doc.text("Returned", 440, y);
                doc.text("Final", 510, y);
                doc.text("Status", 560, y);
                doc.strokeColor("#8a2be2").moveTo(40, y + 15).lineTo(580, y + 15).stroke();

                y += 25;
                doc.fontSize(8).fillColor("#000000");
            }

            // Format fields safely (show "-" if missing)
            const cancelled =
                row["Cancelled Amount"] && row["Cancelled Amount"] > 0
                    ? `Rs.${row["Cancelled Amount"].toLocaleString()}`
                    : "-";

            const returned =
                row["Returned Amount"] && row["Returned Amount"] > 0
                    ? `Rs.${row["Returned Amount"].toLocaleString()}`
                    : "-";

            doc.text(row["Order ID"].substring(0, 12), 40, y);
            doc.text(row["Customer Name"].substring(0, 15), 100, y);
            doc.text(row["Order Date"], 190, y);
            doc.text(`Rs.${row["Total Amount"].toLocaleString()}`, 250, y);
            doc.text(`Rs.${row["Discount"].toLocaleString()}`, 310, y);
            doc.text(cancelled, 370, y);
            doc.text(returned, 440, y);
            doc.text(`Rs.${row["Final Amount"].toLocaleString()}`, 510, y);
            doc.text(row["Order Status"].substring(0, 10), 560, y);

            y += 18;

            // Light separator line every 5 rows
            if ((index + 1) % 5 === 0) {
                doc.strokeColor("#e0e0e0").moveTo(40, y).lineTo(580, y).stroke();
                y += 5;
            }
        });

        doc
            .fontSize(8)
            .fillColor("#666666")
            .text(
                `Generated by ShadElectro Admin Panel on ${new Date().toLocaleString(
                    "en-IN"
                )}`,
                40,
                doc.page.height - 50
            );

        doc.end();
    } catch (error) {
        throw error;
    }
}



export { exportToPDF, exportToCSV, exportToExcel }