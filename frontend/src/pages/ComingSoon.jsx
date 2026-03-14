import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { RocketOutlined } from "@ant-design/icons";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          <div className="p-8 sm:p-12">
            <Result
              status="info"
              icon={<RocketOutlined style={{ fontSize: 72, color: "#6366f1" }} />}
              title={
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  Coming Soon
                </span>
              }
              subTitle={
                <span className="text-slate-600 dark:text-slate-400 text-base">
                  This feature will be available soon. We&apos;re building something great.
                </span>
              }
              extra={
                <Button
                  type="primary"
                  size="large"
                  className="!rounded-full !px-8 !h-12 !font-semibold !bg-gradient-to-r !from-indigo-500 !to-purple-500 !border-0 hover:!from-indigo-600 hover:!to-purple-600"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
