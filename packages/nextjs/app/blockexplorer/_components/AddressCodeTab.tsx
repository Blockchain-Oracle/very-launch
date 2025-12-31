type AddressCodeTabProps = {
  bytecode: string;
  assembly: string;
};

export const AddressCodeTab = ({ bytecode, assembly }: AddressCodeTabProps) => {
  const formattedAssembly = Array.from(assembly.matchAll(/\w+( 0x[a-fA-F0-9]+)?/g))
    .map(it => it[0])
    .join("\n");

  return (
    <div className="flex flex-col gap-3 p-4 text-white">
      <span className="text-white font-semibold">Bytecode</span>
      <div className="mockup-code -indent-5 overflow-y-auto max-h-[500px] bg-[#1A1A1A] border border-gray-700">
        <pre className="px-5 text-gray-300">
          <code className="whitespace-pre-wrap overflow-auto break-words text-gray-300">{bytecode}</code>
        </pre>
      </div>
      <span className="text-white font-semibold">Opcodes</span>
      <div className="mockup-code -indent-5 overflow-y-auto max-h-[500px] bg-[#1A1A1A] border border-gray-700">
        <pre className="px-5 text-gray-300">
          <code className="text-gray-300">{formattedAssembly}</code>
        </pre>
      </div>
    </div>
  );
};
