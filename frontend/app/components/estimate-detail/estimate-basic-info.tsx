import type { UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Estimate } from "@/lib/types";

interface BasicInfoFormValues {
  project_name: string;
  estimate_number: string;
  issue_date: string;
  expiry_date: string;
  customer_name?: string;
  in_charge_name?: string;
}

interface EstimateBasicInfoProps {
  estimate: Estimate;
  form: UseFormReturn<BasicInfoFormValues>;
  onInputChange: (field: keyof Estimate, value: string) => void;
}

export function EstimateBasicInfo({
  form,
  onInputChange,
}: EstimateBasicInfoProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">基本情報</h2>

      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estimate_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>見積番号</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    プロジェクト名 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="プロジェクト名を入力"
                      onChange={(e) => {
                        field.onChange(e);
                        onInputChange("project_name", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issue_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    発行日 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={(date) => {
                        field.onChange(date);
                        onInputChange("issue_date", date);
                      }}
                      placeholder="発行日を選択"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    有効期限 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={(date) => {
                        field.onChange(date);
                        onInputChange("expiry_date", date);
                      }}
                      placeholder="有効期限を選択"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>顧客名</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="株式会社〇〇"
                      onChange={(e) => {
                        field.onChange(e);
                        onInputChange("customer_name", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="in_charge_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>担当者名</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="山田 太郎"
                      onChange={(e) => {
                        field.onChange(e);
                        onInputChange("in_charge_name", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </Form>
    </Card>
  );
}
