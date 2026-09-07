import type { Estimate } from "@/lib/types";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// 日本語フォントの登録
Font.register({
  family: "NotoSansJP",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJEj75vY0rw-oME.ttf",
      fontWeight: 700,
    },
  ],
});

// Stylesの定義
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "NotoSansJP",
  },
  header: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 100,
    fontWeight: "bold",
  },
  infoValue: {
    flex: 1,
  },
  clientSection: {
    marginBottom: 20,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 10,
  },
  projectSection: {
    marginBottom: 15,
  },
  projectName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E5E5E5",
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    fontWeight: "bold",
    padding: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    padding: 5,
  },
  col1: {
    width: "20%",
  },
  col2: {
    width: "30%",
  },
  col3: {
    width: "15%",
    textAlign: "right",
  },
  col4: {
    width: "15%",
    textAlign: "right",
  },
  col5: {
    width: "20%",
    textAlign: "right",
  },
  totalSection: {
    marginLeft: "auto",
    width: 200,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginVertical: 5,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
    textAlign: "right",
  },
  totalLabelBold: {
    fontSize: 12,
    fontWeight: "bold",
  },
  totalValueBold: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  remarksSection: {
    marginTop: 10,
  },
  remarksLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  remarksContent: {
    fontSize: 9,
  },
});

export const EstimatePDFDocument = ({ estimate }: { estimate: Estimate }) => {
  const items = estimate.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <Text style={styles.header}>御見積書</Text>

        {/* 基本情報 */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>見積番号:</Text>
            <Text style={styles.infoValue}>{estimate.estimate_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>発行日:</Text>
            <Text style={styles.infoValue}>{estimate.issue_date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>有効期限:</Text>
            <Text style={styles.infoValue}>{estimate.expiry_date}</Text>
          </View>
        </View>

        {/* クライアント情報 */}
        <View style={styles.clientSection}>
          <Text style={styles.clientName}>
            お客様名: {estimate.customer_name || ""}
          </Text>
          <Text style={styles.clientDetail}>
            担当者: {estimate.in_charge_name || ""}
          </Text>
        </View>

        {/* プロジェクト名 */}
        <View style={styles.projectSection}>
          <Text style={styles.projectName}>
            プロジェクト: {estimate.project_name}
          </Text>
        </View>

        {/* 明細表 */}
        <View style={styles.table}>
          {/* ヘッダー */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>カテゴリ</Text>
            <Text style={styles.col2}>品目</Text>
            <Text style={styles.col3}>数量</Text>
            <Text style={styles.col4}>単価</Text>
            <Text style={styles.col5}>金額</Text>
          </View>

          {/* データ行 */}
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.category?.name || ""}</Text>
              <Text style={styles.col2}>{item.item_name}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>¥{item.price.toLocaleString()}</Text>
              <Text style={styles.col5}>¥{item.subtotal.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* 合計セクション */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>小計:</Text>
            <Text style={styles.totalValue}>¥{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>消費税(10%):</Text>
            <Text style={styles.totalValue}>¥{tax.toLocaleString()}</Text>
          </View>

          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>合計:</Text>
            <Text style={styles.totalValueBold}>¥{total.toLocaleString()}</Text>
          </View>
        </View>

        {/* 備考 */}
        {estimate.remarks && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksLabel}>備考:</Text>
            <Text style={styles.remarksContent}>{estimate.remarks}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
