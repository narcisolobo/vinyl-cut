import { Grade } from "./grades";
import Pips from "./Pips";

function GradingGuideTableRow({ symbol, title, description, pips }: Grade) {
  return (
    <tr className="border-accent/30 border-b">
      <th
        scope="row"
        className="text-primary font-heading w-1/6 py-6 align-top text-xl font-normal"
      >
        {symbol}
      </th>
      <td className="py-6 align-top">
        <p className="text-xl font-bold">{title}</p>
        <p>{description}</p>
      </td>
      <td className="py-6 align-top">
        <Pips pips={pips} />
      </td>
    </tr>
  );
}

export default GradingGuideTableRow;
