import { LoadingOutlined } from "@ant-design/icons";

/**
 * Loader component covering entire screen
 */

export const Loader = () => {
  return (
    <section className="pointer-events-none grid min-h-[80vh] w-full place-items-center">
      <button type="button" className="flex gap-1" disabled>
        <LoadingOutlined className="animate-spin text-2xl sm:text-3xl" />
        <span className="sm:text-lg">Loading</span>
        <div className="space-x-1">
          <span className="inline-block size-1 rounded-full bg-black"></span>
          <span className="inline-block size-1 rounded-full bg-black"></span>
          <span className="inline-block size-1 rounded-full bg-black"></span>
        </div>
      </button>
    </section>
  );
};
