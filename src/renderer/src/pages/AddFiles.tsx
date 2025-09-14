import { Button, Card, Divider, Input } from "antd";
import { CiSearch } from "react-icons/ci";

const mock = [
  {
    name: "Liam Carter",
    dob: "01/01/1990",
  },
  {
    name: "Tim Cook",
    dob: "01/01/1990",
  },
  {
    name: "Bob adam",
    dob: "01/01/1990",
  },
];

function AddFiles(): JSX.Element {
  return (
    <div className="flex w-full justify-start">
      <div
        className="absolute w-[250px] bg-[rgba(255,255,255,.2)] h-[86%] top-[12%] right-[1.5%] p-6 rounded-lg"
        style={{
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `,
        }}
      >
        <h1 className="text-2xl mb-2">Patients</h1>
        <Input
          className="rounded-none bg-[rgba(255,255,255,.2)] cursor-pointer"
          size="large"
          prefix={<CiSearch />}
          style={{
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `,
          }}
        />
        <div className="flex flex-col gap-2 my-2">
          {mock.map((item, index) => {
            return (
              <Card
                key={index}
                className="rounded-none bg-[rgba(255,255,255,.2)] cursor-pointer"
                style={{}}
              >
                <div className="flex flex-row items-center gap-4">
                  <img
                    className="w-6 h-6 rounded-full"
                    src="https://media.istockphoto.com/id/2151669184/vector/vector-flat-illustration-in-grayscale-avatar-user-profile-person-icon-gender-neutral.jpg?s=612x612&w=0&k=20&c=UEa7oHoOL30ynvmJzSCIPrwwopJdfqzBs0q69ezQoM8="
                  />
                  <div>
                    <b className="text-gray-100">{item.name}</b>
                    <p className="text-gray-100">{item.dob}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div
        className="absolute w-[75%] bg-[rgba(255,255,255,.2)] h-[86%] top-[12%] let-[1.5%] p-6 rounded-lg overflow-y-auto"
        style={{
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `,
        }}
      >
        <h1 className="text-3xl">Liam Carter</h1>
        <div className="flex flex-row gap-5 w-full">
          <div className="flex flex-col flex-grow basis-1/3">
            <Divider />
            <b className="text-slate-500">Date of Birth</b>
            <p>01/01/1990</p>
          </div>

          <div className="flex flex-col flex-grow-[5]">
            <Divider />
            <b className="text-slate-500">Gender</b>
            <p>Male</p>
          </div>
        </div>

        <div className="flex flex-row gap-5 w-full">
          <div className="flex flex-col flex-grow basis-1/3">
            <Divider />
            <b className="text-slate-500">Height</b>
            <p>180cm</p>
          </div>

          <div className="flex flex-col flex-grow-[5]">
            <Divider />
            <b className="text-slate-500">Weight</b>
            <p>75kg</p>
          </div>
        </div>

        <div className="flex flex-row gap-5 w-full">
          <div className="flex flex-col flex-grow basis-1/3">
            <Divider />
            <b className="text-slate-500">Blood Type</b>
            <p>O</p>
          </div>
        </div>

        <h1 className="text-2xl mt-10">Medical History</h1>

        <div className="flex flex-row gap-5 w-full">
          <div className="flex flex-col flex-grow basis-1/3">
            <Divider />
            <b className="text-slate-500">Allergies</b>
            <p>None</p>
          </div>
          <div className="flex flex-col flex-grow-[5]">
            <Divider />
            <b className="text-slate-500">Medications</b>
            <p>None</p>
          </div>
        </div>

        <div className="flex flex-row gap-5 w-full">
          <div className="flex flex-col flex-grow basis-1/3">
            <Divider />
            <b className="text-slate-500">Conditions</b>
            <p>None</p>
          </div>
          <div className="flex flex-col flex-grow-[5]">
            <Divider />
            <b className="text-slate-500">Surgeries</b>
            <p>None</p>
          </div>
        </div>

        <h1 className="text-2xl mt-10">Recordings</h1>

        <div className="w-full flex flex-col justify-center items-center h-[200px] my-5 rounded-md border-[2px] border-dashed border-gray-400">
          <div className="flex flex-col justify-center items-center mb-4">
            <b className="text-lg font-bold">No Recordings Yet</b>
            <p>Recordings will appear here once they are added</p>
          </div>
          <Button>Add recording</Button>
        </div>
      </div>
    </div>
  );
}

export default AddFiles;
